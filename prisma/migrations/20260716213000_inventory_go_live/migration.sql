CREATE TYPE "RawMaterialInventoryActivationSource" AS ENUM ('OPENING_COUNT', 'POST_GO_LIVE_GRN');

ALTER TABLE "RawMaterial"
  ADD COLUMN "inventoryActivatedAt" TIMESTAMP(3),
  ADD COLUMN "inventoryActivationSource" "RawMaterialInventoryActivationSource";

CREATE INDEX "RawMaterial_inventoryActivatedAt_idx" ON "RawMaterial"("inventoryActivatedAt");

ALTER TABLE "inventory_settings"
  ADD COLUMN "inventoryGoLiveDate" TIMESTAMP(3),
  ADD COLUMN "physicalStockCountAt" TIMESTAMP(3);
