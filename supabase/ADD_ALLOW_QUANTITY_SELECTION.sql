-- Migration: add allow_quantity_selection to products

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allow_quantity_selection BOOLEAN NOT NULL DEFAULT false;
