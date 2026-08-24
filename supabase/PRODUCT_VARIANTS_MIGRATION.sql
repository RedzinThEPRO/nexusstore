-- NexusStore: product options / variants extension
-- Execute after SUPABASE_SETUP.sql. Existing products remain valid.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory_mode TEXT NOT NULL DEFAULT 'SINGLE';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_inventory_mode_check;
ALTER TABLE public.products ADD CONSTRAINT products_inventory_mode_check CHECK (inventory_mode IN ('SINGLE', 'MULTIPLE'));
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_variants_array_check;
ALTER TABLE public.products ADD CONSTRAINT products_variants_array_check CHECK (jsonb_typeof(variants) = 'array');
COMMENT ON COLUMN public.products.inventory_mode IS 'SINGLE for a normal product, MULTIPLE for selectable product options';
COMMENT ON COLUMN public.products.variants IS 'JSON array of option records: id, name, description, price, promo_price, stock, images, delivery_info, active, sku';
