-- NexusStore — Etapa 2: produtos únicos e múltiplos (variantes) no checkout
-- Migration incremental e não destrutiva. Executar depois de:
--   SUPABASE_SETUP.sql, FINAL_SECURITY_MIGRATION.sql, CREATE_PUBLIC_ORDER_RPC.sql,
--   PRODUCT_VARIANTS_MIGRATION.sql e ADD_ALLOW_QUANTITY_SELECTION.sql
-- Reutiliza a estrutura existente: products.inventory_mode + products.variants (JSONB).
-- Nenhum dado é apagado; pedidos antigos continuam válidos (variant_id fica NULL).

BEGIN;

-- ============================================================
--  ORDER ITEMS: identificação da variante comprada
-- ============================================================
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id   TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
COMMENT ON COLUMN public.order_items.variant_id IS 'Id da variante em products.variants; NULL para produtos únicos';
COMMENT ON COLUMN public.order_items.variant_name IS 'Nome da variante no momento da compra';

-- ============================================================
--  HELPERS DE VARIANTE
-- ============================================================

-- Retorna o objeto JSON da variante do produto, ou NULL quando não existir.
CREATE OR REPLACE FUNCTION public.find_product_variant(p_variants jsonb, p_variant_id text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT v
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_variants) = 'array' THEN p_variants ELSE '[]'::jsonb END) AS v
  WHERE v->>'id' = p_variant_id
  LIMIT 1;
$$;

-- Preço efetivo da variante (promoção quando válida).
CREATE OR REPLACE FUNCTION public.variant_unit_price(p_variant jsonb)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(NULLIF(p_variant->>'promo_price', ''), '0')::numeric > 0
      AND (p_variant->>'promo_price')::numeric < COALESCE(NULLIF(p_variant->>'price', ''), '0')::numeric
    THEN (p_variant->>'promo_price')::numeric
    ELSE COALESCE(NULLIF(p_variant->>'price', ''), '0')::numeric
  END;
$$;

-- Valida produto/variante/quantidade e devolve os dados confiáveis (do banco) do item.
-- Nunca usa preço/estoque enviados pelo cliente.
CREATE OR REPLACE FUNCTION public.resolve_order_item(p_item jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  product_row public.products%ROWTYPE;
  variant jsonb;
  variant_id text := nullif(btrim(COALESCE(p_item->>'variant_id', '')), '');
  qty integer;
  unit_price numeric(10,2);
BEGIN
  IF jsonb_typeof(p_item->'quantity') = 'number' AND (p_item->>'quantity') ~ '\.' THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;
  qty := (p_item->>'quantity')::integer;
  IF qty IS NULL OR qty < 1 OR qty > 100 THEN RAISE EXCEPTION 'invalid quantity'; END IF;

  SELECT * INTO product_row FROM public.products
    WHERE id = (p_item->>'product_id')::uuid AND status = 'ACTIVE'
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'product unavailable'; END IF;

  IF product_row.requires_free_fire_id
     AND nullif(btrim(COALESCE(p_item->>'free_fire_id', '')), '') IS NULL THEN
    RAISE EXCEPTION 'free fire id required';
  END IF;

  IF COALESCE(product_row.inventory_mode, 'SINGLE') = 'MULTIPLE' THEN
    IF variant_id IS NULL THEN RAISE EXCEPTION 'variant required'; END IF;
    variant := public.find_product_variant(product_row.variants, variant_id);
    IF variant IS NULL THEN RAISE EXCEPTION 'variant unavailable'; END IF;
    IF COALESCE((variant->>'active')::boolean, true) IS NOT TRUE THEN RAISE EXCEPTION 'variant unavailable'; END IF;
    IF COALESCE((variant->>'stock')::integer, 0) < qty THEN RAISE EXCEPTION 'variant unavailable'; END IF;
    unit_price := public.variant_unit_price(variant);
    IF unit_price IS NULL OR unit_price <= 0 THEN RAISE EXCEPTION 'variant unavailable'; END IF;
    RETURN jsonb_build_object(
      'product_id', product_row.id,
      'product_name', product_row.name,
      'product_image', COALESCE((variant->'images'->>0), product_row.images[1]),
      'variant_id', variant_id,
      'variant_name', variant->>'name',
      'quantity', qty,
      'unit_price', unit_price
    );
  END IF;

  -- Produto único: variante não é aceita e o estoque próprio é usado.
  IF variant_id IS NOT NULL THEN RAISE EXCEPTION 'variant not allowed'; END IF;
  IF product_row.stock < qty THEN RAISE EXCEPTION 'product unavailable'; END IF;
  unit_price := COALESCE(product_row.promo_price, product_row.price);
  RETURN jsonb_build_object(
    'product_id', product_row.id,
    'product_name', product_row.name,
    'product_image', product_row.images[1],
    'variant_id', NULL,
    'variant_name', NULL,
    'quantity', qty,
    'unit_price', unit_price
  );
END;
$$;

-- Baixa de estoque atômica (produto único ou variante). Nunca deixa estoque negativo.
CREATE OR REPLACE FUNCTION public.reserve_product_stock(p_product_id uuid, p_variant_id text, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_variants jsonb;
  current_stock integer;
BEGIN
  IF p_variant_id IS NULL THEN
    UPDATE public.products SET stock = stock - p_quantity, updated_at = now()
      WHERE id = p_product_id AND stock >= p_quantity;
    IF NOT FOUND THEN RAISE EXCEPTION 'stock changed, retry checkout'; END IF;
    RETURN;
  END IF;

  SELECT variants INTO current_variants FROM public.products WHERE id = p_product_id FOR UPDATE;
  current_stock := COALESCE((public.find_product_variant(current_variants, p_variant_id)->>'stock')::integer, -1);
  IF current_stock < p_quantity THEN RAISE EXCEPTION 'stock changed, retry checkout'; END IF;

  UPDATE public.products SET
    variants = (
      SELECT jsonb_agg(CASE WHEN v->>'id' = p_variant_id
        THEN jsonb_set(v, '{stock}', to_jsonb(current_stock - p_quantity))
        ELSE v END)
      FROM jsonb_array_elements(current_variants) AS v
    ),
    stock = greatest(0, stock - p_quantity),
    updated_at = now()
  WHERE id = p_product_id;
END;
$$;

-- ============================================================
--  RPC: checkout autenticado (com suporte a variantes)
-- ============================================================
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
  resolved jsonb;
  resolved_items jsonb := '[]'::jsonb;
  order_id uuid := gen_random_uuid();
  subtotal numeric(10,2) := 0;
  discount numeric(10,2) := 0;
  total numeric(10,2);
  coupon_row public.coupons%ROWTYPE;
  item_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'invalid checkout';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    resolved := public.resolve_order_item(item);
    resolved := resolved || jsonb_build_object('free_fire_id', nullif(btrim(COALESCE(item->>'free_fire_id', '')), ''));
    resolved_items := resolved_items || jsonb_build_array(resolved);
    subtotal := subtotal + (resolved->>'unit_price')::numeric * (resolved->>'quantity')::integer;
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

  FOR item IN SELECT value FROM jsonb_array_elements(resolved_items)
  LOOP
    PERFORM public.reserve_product_stock((item->>'product_id')::uuid, item->>'variant_id', (item->>'quantity')::integer);
    INSERT INTO public.order_items(order_id, product_id, product_name, product_image, price, quantity, free_fire_id, variant_id, variant_name)
      VALUES (order_id, (item->>'product_id')::uuid, item->>'product_name', item->>'product_image',
              (item->>'unit_price')::numeric, (item->>'quantity')::integer, item->>'free_fire_id',
              item->>'variant_id', item->>'variant_name');
  END LOOP;

  IF coupon_row.id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id) VALUES (coupon_row.id, auth.uid(), order_id);
  END IF;

  RETURN jsonb_build_object('order_id', order_id, 'subtotal', subtotal, 'discount', least(discount, subtotal), 'total', total, 'item_count', item_count);
END;
$$;

-- ============================================================
--  RPC: checkout guest (com suporte a variantes)
-- ============================================================
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
  resolved jsonb;
  resolved_items jsonb := '[]'::jsonb;
  order_id uuid := gen_random_uuid();
  subtotal numeric(10,2) := 0;
  discount numeric(10,2) := 0;
  total numeric(10,2);
  coupon_row public.coupons%ROWTYPE;
  item_count integer := 0;
BEGIN
  IF p_user_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'invalid checkout';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    resolved := public.resolve_order_item(item);
    resolved := resolved || jsonb_build_object('free_fire_id', nullif(btrim(COALESCE(item->>'free_fire_id', '')), ''));
    resolved_items := resolved_items || jsonb_build_array(resolved);
    subtotal := subtotal + (resolved->>'unit_price')::numeric * (resolved->>'quantity')::integer;
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
      OR (coupon_row.uses_per_user IS NOT NULL AND (SELECT count(*) FROM coupon_usages WHERE coupon_id = coupon_row.id AND user_id = p_user_id) >= coupon_row.uses_per_user)
    THEN
      RAISE EXCEPTION 'invalid coupon';
    END IF;
    discount := CASE WHEN coupon_row.type = 'PERCENT'
      THEN subtotal * coupon_row.value / 100 ELSE coupon_row.value END;
  END IF;

  total := greatest(0, subtotal - least(discount, subtotal));

  INSERT INTO public.orders(id, user_id, subtotal, discount, total, coupon_code, status, payment_status)
    VALUES (order_id, p_user_id, subtotal, least(discount, subtotal), total, nullif(btrim(p_coupon_code), ''), 'PENDING', 'PENDING');

  FOR item IN SELECT value FROM jsonb_array_elements(resolved_items)
  LOOP
    PERFORM public.reserve_product_stock((item->>'product_id')::uuid, item->>'variant_id', (item->>'quantity')::integer);
    INSERT INTO public.order_items(order_id, product_id, product_name, product_image, price, quantity, free_fire_id, variant_id, variant_name)
      VALUES (order_id, (item->>'product_id')::uuid, item->>'product_name', item->>'product_image',
              (item->>'unit_price')::numeric, (item->>'quantity')::integer, item->>'free_fire_id',
              item->>'variant_id', item->>'variant_name');
    INSERT INTO public.inventory_movements(product_id, type, quantity, reason, created_at)
      VALUES ((item->>'product_id')::uuid, 'out', (item->>'quantity')::integer, 'order_reservation', now());
  END LOOP;

  IF coupon_row.id IS NOT NULL THEN
    INSERT INTO public.coupon_usages(coupon_id, user_id, order_id) VALUES (coupon_row.id, p_user_id, order_id);
  END IF;

  RETURN jsonb_build_object('order_id', order_id, 'subtotal', subtotal, 'discount', least(discount, subtotal), 'total', total, 'item_count', item_count);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_order_item(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_product_stock(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_secure(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_public(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_secure(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_public(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_public(uuid, jsonb, text) TO service_role;

CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

COMMIT;
