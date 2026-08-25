-- RPC: create_order_public
-- Creates an order on behalf of a provided user_id (guest profile), calculates prices and discounts server-side,
-- updates stock atomically and inserts order_items + inventory_movements.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_order_public(
  p_user_id uuid,
  p_items jsonb,
  p_coupon_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  product_row public.products%ROWTYPE;
  order_id uuid := gen_random_uuid();
  subtotal numeric(10,2) := 0;
  discount numeric(10,2) := 0;
  total numeric(10,2);
  qty integer;
  unit_price numeric(10,2);
  coupon_row public.coupons%ROWTYPE;
  item_count integer := 0;
BEGIN
  IF p_user_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'invalid checkout';
  END IF;

  -- Calculate subtotal and validate requested quantities against products (lock rows)
  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    qty := (item->>'quantity')::integer;
    IF qty IS NULL OR qty < 1 OR qty > 100 THEN RAISE EXCEPTION 'invalid quantity'; END IF;
    SELECT * INTO product_row FROM public.products
      WHERE id = (item->>'product_id')::uuid AND status = 'ACTIVE' FOR UPDATE;
    IF NOT FOUND OR product_row.stock < qty THEN RAISE EXCEPTION 'product unavailable'; END IF;
    unit_price := COALESCE(product_row.promo_price, product_row.price);
    subtotal := subtotal + unit_price * qty;
    item_count := item_count + 1;
  END LOOP;

  -- Coupon validation (if provided)
  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT * INTO coupon_row FROM public.coupons
      WHERE lower(code) = lower(btrim(p_coupon_code))
        AND active = true
        AND (expires_at IS NULL OR expires_at > now())
      FOR UPDATE;
    IF NOT FOUND OR (coupon_row.min_order IS NOT NULL AND subtotal < coupon_row.min_order)
      OR (coupon_row.max_uses IS NOT NULL AND (SELECT count(*) FROM coupon_usages WHERE coupon_id = coupon_row.id) >= coupon_row.max_uses)
      OR (coupon_row.uses_per_user IS NOT NULL AND (SELECT count(*) FROM coupon_usages WHERE coupon_id = coupon_row.id AND user_id = p_user_id) >= coupon_row.uses_per_user)
    THEN
      RAISE EXCEPTION 'invalid coupon';
    END IF;
    discount := CASE WHEN coupon_row.type = 'PERCENT'
      THEN subtotal * coupon_row.value / 100 ELSE coupon_row.value END;
  END IF;

  total := greatest(0, subtotal - least(discount, subtotal));

  -- Create order
  INSERT INTO public.orders(id, user_id, subtotal, discount, total, coupon_code, status, payment_status)
    VALUES (order_id, p_user_id, subtotal, least(discount, subtotal), total, nullif(btrim(p_coupon_code), ''), 'PENDING', 'PENDING');

  -- Reserve stock and create order_items
  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'product_id')::uuid FOR UPDATE;
    qty := (item->>'quantity')::integer;
    UPDATE public.products SET stock = stock - qty WHERE id = product_row.id AND stock >= qty;
    IF NOT FOUND THEN RAISE EXCEPTION 'stock changed, retry checkout'; END IF;
    INSERT INTO public.order_items(order_id, product_id, product_name, product_image, price, quantity, free_fire_id)
      VALUES (order_id, product_row.id, product_row.name, product_row.images[1], COALESCE(product_row.promo_price, product_row.price), qty, item->>'free_fire_id');
    INSERT INTO public.inventory_movements(product_id, type, quantity, reason, created_at)
      VALUES (product_row.id, 'out', qty, 'order_reservation', now());
  END LOOP;

  IF coupon_row.id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id) VALUES (coupon_row.id, p_user_id, order_id);
  END IF;

  RETURN jsonb_build_object('order_id', order_id, 'subtotal', subtotal, 'discount', least(discount, subtotal), 'total', total, 'item_count', item_count);
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_public(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_public(uuid, jsonb, text) TO authenticated;

COMMIT;
