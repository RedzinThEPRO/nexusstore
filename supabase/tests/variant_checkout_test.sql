-- Scenario tests for single/multiple product checkout (Etapa 2).
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE OR REPLACE FUNCTION test_expect_error(p_sql text, p_expected text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE msg text;
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN others THEN
    msg := SQLERRM;
  END;
  IF msg IS NULL THEN RAISE EXCEPTION 'FAIL: expected "%" but statement succeeded: %', p_expected, p_sql; END IF;
  IF position(p_expected in msg) = 0 THEN RAISE EXCEPTION 'FAIL: expected "%" got "%"', p_expected, msg; END IF;
  RAISE NOTICE 'ok: %', p_expected;
END;
$$;

-- fixtures ------------------------------------------------------------------
INSERT INTO auth.users(id, email) VALUES ('00000000-0000-4000-8000-000000000001', 'guest@example.com');
INSERT INTO profiles(id, username, email, role)
  VALUES ('00000000-0000-4000-8000-000000000001', 'guest', 'guest@example.com', 'USER')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO products(id, name, slug, images, price, promo_price, game, stock, status, requires_free_fire_id)
  VALUES ('00000000-0000-4000-8000-0000000000a1', 'Produto Único', 'produto-unico',
          ARRAY['img-single.png'], 100.00, 80.00, 'Free Fire', 5, 'ACTIVE', false);

INSERT INTO products(id, name, slug, images, price, game, stock, status, requires_free_fire_id, inventory_mode, variants)
  VALUES ('00000000-0000-4000-8000-0000000000a2', 'Produto Múltiplo', 'produto-multiplo',
          ARRAY['img-multi.png'], 0, 'Free Fire', 0, 'ACTIVE', true, 'MULTIPLE',
          '[{"id":"v1","name":"Opção 1","price":50,"promo_price":40,"stock":3,"active":true,"images":["v1.png"]},
            {"id":"v2","name":"Opção 2","price":70,"stock":0,"active":true},
            {"id":"v3","name":"Opção 3","price":90,"stock":10,"active":false}]'::jsonb);

INSERT INTO products(id, name, slug, images, price, game, stock, status, inventory_mode)
  VALUES ('00000000-0000-4000-8000-0000000000a3', 'Inativo', 'inativo', ARRAY['x.png'], 10, 'Free Fire', 5, 'INACTIVE', 'SINGLE');

-- 1. produto único: preço vem do banco (promo), estoque baixa ---------------
DO $$
DECLARE r jsonb; s integer;
BEGIN
  r := create_order_public('00000000-0000-4000-8000-000000000001',
        '[{"product_id":"00000000-0000-4000-8000-0000000000a1","quantity":2}]'::jsonb);
  IF (r->>'total')::numeric <> 160.00 THEN RAISE EXCEPTION 'FAIL total único: %', r; END IF;
  SELECT stock INTO s FROM products WHERE id = '00000000-0000-4000-8000-0000000000a1';
  IF s <> 3 THEN RAISE EXCEPTION 'FAIL estoque único: %', s; END IF;
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (r->>'order_id')::uuid AND variant_id IS NULL AND price = 80.00) THEN
    RAISE EXCEPTION 'FAIL order_items único';
  END IF;
  RAISE NOTICE 'ok: produto único usa preço e estoque do banco';
END $$;

-- 2. produto múltiplo: variante correta, preço promocional, estoque da variante
DO $$
DECLARE r jsonb; v jsonb;
BEGIN
  r := create_order_public('00000000-0000-4000-8000-000000000001',
        '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"v1","quantity":2,"free_fire_id":"123456"}]'::jsonb);
  IF (r->>'total')::numeric <> 80.00 THEN RAISE EXCEPTION 'FAIL total variante: %', r; END IF;
  SELECT find_product_variant(variants, 'v1') INTO v FROM products WHERE id = '00000000-0000-4000-8000-0000000000a2';
  IF (v->>'stock')::integer <> 1 THEN RAISE EXCEPTION 'FAIL estoque variante: %', v; END IF;
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (r->>'order_id')::uuid
                   AND variant_id = 'v1' AND variant_name = 'Opção 1' AND price = 40.00 AND product_image = 'v1.png') THEN
    RAISE EXCEPTION 'FAIL order_items variante';
  END IF;
  RAISE NOTICE 'ok: variante correta com preço e estoque do banco';
END $$;

-- 3. validações -------------------------------------------------------------
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a2","quantity":1,"free_fire_id":"1"}]'::jsonb)$$, 'variant required');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"v1","quantity":1}]'::jsonb)$$, 'free fire id required');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"nope","quantity":1,"free_fire_id":"1"}]'::jsonb)$$, 'variant unavailable');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"v2","quantity":1,"free_fire_id":"1"}]'::jsonb)$$, 'variant unavailable');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"v3","quantity":1,"free_fire_id":"1"}]'::jsonb)$$, 'variant unavailable');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a1","variant_id":"v1","quantity":1}]'::jsonb)$$, 'variant not allowed');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a3","quantity":1}]'::jsonb)$$, 'product unavailable');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a1","quantity":999}]'::jsonb)$$, 'invalid quantity');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a1","quantity":0}]'::jsonb)$$, 'invalid quantity');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a1","quantity":-1}]'::jsonb)$$, 'invalid quantity');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a1","quantity":1.5}]'::jsonb)$$, 'invalid quantity');
SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a1","quantity":4}]'::jsonb)$$, 'product unavailable');

-- 4. preço enviado pelo navegador é ignorado --------------------------------
DO $$
DECLARE r jsonb;
BEGIN
  r := create_order_public('00000000-0000-4000-8000-000000000001',
        '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"v1","quantity":1,"free_fire_id":"1","price":0.01,"stock":999}]'::jsonb);
  IF (r->>'total')::numeric <> 40.00 THEN RAISE EXCEPTION 'FAIL preço adulterado aceito: %', r; END IF;
  RAISE NOTICE 'ok: preço/estoque enviados pelo cliente são ignorados';
END $$;

-- 5. estoque nunca fica negativo --------------------------------------------
DO $$
DECLARE v jsonb; s integer;
BEGIN
  SELECT find_product_variant(variants, 'v1') INTO v FROM products WHERE id = '00000000-0000-4000-8000-0000000000a2';
  IF (v->>'stock')::integer <> 0 THEN RAISE EXCEPTION 'FAIL estoque v1: %', v; END IF;
  SELECT stock INTO s FROM products WHERE id = '00000000-0000-4000-8000-0000000000a2';
  IF s < 0 THEN RAISE EXCEPTION 'FAIL estoque agregado negativo: %', s; END IF;
  RAISE NOTICE 'ok: estoque agregado e da variante não ficam negativos';
END $$;

SELECT test_expect_error($$SELECT create_order_public('00000000-0000-4000-8000-000000000001',
  '[{"product_id":"00000000-0000-4000-8000-0000000000a2","variant_id":"v1","quantity":1,"free_fire_id":"1"}]'::jsonb)$$, 'variant unavailable');

\echo 'ALL VARIANT CHECKOUT TESTS PASSED'
