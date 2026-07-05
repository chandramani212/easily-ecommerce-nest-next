-- Split the product SKU into a website SKU (`sku`) and the supplier/API SKU
-- (`externalSku`). The storefront keeps reading `sku`; imports move to `externalSku`.

-- 1. New column holding the supplier/API SKU; preserve every current value into it.
ALTER TABLE "Product" ADD COLUMN "externalSku" TEXT;
UPDATE "Product" SET "externalSku" = "sku";
CREATE UNIQUE INDEX "Product_externalSku_key" ON "Product"("externalSku");

-- 2. Repurpose `sku` as the website's own SKU. Sequence drives EB-NNNNNN values.
CREATE SEQUENCE IF NOT EXISTS "product_sku_seq";

-- Regenerate a clean website SKU for every existing product (deterministic order).
UPDATE "Product" AS p
SET "sku" = gen.new_sku
FROM (
  SELECT id, 'EB-' || lpad(nextval('product_sku_seq')::text, 6, '0') AS new_sku
  FROM "Product"
  ORDER BY "createdAt" ASC, id ASC
) AS gen
WHERE p.id = gen.id;

-- New inserts default to the next website SKU; admins/imports may override.
ALTER TABLE "Product"
  ALTER COLUMN "sku"
  SET DEFAULT ('EB-' || lpad(nextval('product_sku_seq')::text, 6, '0'));
