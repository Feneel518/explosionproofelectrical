-- Preserve legacy labels used by existing documents. New selections use displayName.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "product_serials" ADD COLUMN IF NOT EXISTS "productNameSnapshot" TEXT;
CREATE INDEX IF NOT EXISTS "Product_displayName_idx" ON "Product"("displayName");
CREATE INDEX IF NOT EXISTS "ProductVariant_displayName_idx" ON "ProductVariant"("displayName");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_current_name_key"
ON "ProductVariant" ("productId", lower(regexp_replace(btrim(COALESCE(NULLIF("displayName", ''), "variant")), '\s+', ' ', 'g')));
