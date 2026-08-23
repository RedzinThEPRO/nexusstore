-- NexusStore final security migration.
-- Safe to run repeatedly. It does not drop tables or data.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- The client may update profile fields, but never identity or authorization fields.
CREATE OR REPLACE FUNCTION public.protect_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NOT public.is_admin() THEN
    NEW.id := OLD.id;
    NEW.role := OLD.role;
    NEW.email := OLD.email;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_security ON public.profiles;
CREATE TRIGGER trg_protect_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security();

-- Do not allow a customer to mutate an order after creation.
DROP POLICY IF EXISTS orders_insert ON public.orders;
DROP POLICY IF EXISTS orders_update ON public.orders;
DROP POLICY IF EXISTS orders_update_admin_only ON public.orders;
CREATE POLICY orders_update_admin_only ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Protect all sensitive tables even if this migration is applied to an older database.
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_events_admin_only ON public.payment_events;
CREATE POLICY payment_events_admin_only ON public.payment_events
  FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS coupon_usages_select_own ON public.coupon_usages;
CREATE POLICY coupon_usages_select_own ON public.coupon_usages
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS inventory_admin_only ON public.inventory;
CREATE POLICY inventory_admin_only ON public.inventory
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS inventory_movements_admin_only ON public.inventory_movements;
CREATE POLICY inventory_movements_admin_only ON public.inventory_movements
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS delivery_chats_select_scoped ON public.delivery_chats;
CREATE POLICY delivery_chats_select_scoped ON public.delivery_chats
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = delivery_chats.delivery_id AND d.user_id = auth.uid()
    )
  );

-- Customers can never write payment state, payment events, coupons, or audit records.
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_events FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.coupon_usages FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

-- Server-side checkout. Prices, discounts and stock are read/calculated here.
CREATE OR REPLACE FUNCTION public.create_order_secure(
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
  IF auth.uid() IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'invalid checkout';
  END IF;

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

  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT * INTO coupon_row FROM public.coupons
      WHERE lower(code) = lower(btrim(p_coupon_code))
        AND active = true
        AND (expires_at IS NULL OR expires_at > now())
      FOR UPDATE;
    IF NOT FOUND OR (coupon_row.min_order IS NOT NULL AND subtotal < coupon_row.min_order)
      OR (coupon_row.max_uses IS NOT NULL AND (SELECT count(*) FROM coupon_usages WHERE coupon_id = coupon_row.id) >= coupon_row.max_uses)
      OR (coupon_row.uses_per_user IS NOT NULL AND (SELECT count(*) FROM coupon_usages WHERE coupon_id = coupon_row.id AND user_id = auth.uid()) >= coupon_row.uses_per_user)
    THEN
      RAISE EXCEPTION 'invalid coupon';
    END IF;
    discount := CASE WHEN coupon_row.type = 'PERCENT'
      THEN subtotal * coupon_row.value / 100 ELSE coupon_row.value END;
  END IF;

  total := greatest(0, subtotal - least(discount, subtotal));
  INSERT INTO public.orders(id, user_id, subtotal, discount, total, coupon_code)
    VALUES (order_id, auth.uid(), subtotal, least(discount, subtotal), total, nullif(btrim(p_coupon_code), ''));

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'product_id')::uuid FOR UPDATE;
    qty := (item->>'quantity')::integer;
    UPDATE public.products SET stock = stock - qty WHERE id = product_row.id AND stock >= qty;
    IF NOT FOUND THEN RAISE EXCEPTION 'stock changed, retry checkout'; END IF;
    INSERT INTO public.order_items(order_id, product_id, product_name, product_image, price, quantity, free_fire_id)
      VALUES (order_id, product_row.id, product_row.name, product_row.images[1], COALESCE(product_row.promo_price, product_row.price), qty, item->>'free_fire_id');
  END LOOP;
  IF coupon_row.id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id) VALUES (coupon_row.id, auth.uid(), order_id);
  END IF;
  RETURN jsonb_build_object('order_id', order_id, 'subtotal', subtotal, 'discount', least(discount, subtotal), 'total', total, 'item_count', item_count);
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_secure(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_secure(jsonb, text) TO authenticated;

COMMIT;