-- Raw-material inventory controls: fractional quantities, employees and returns.
ALTER TYPE "StockReferenceType" ADD VALUE IF NOT EXISTS 'MATERIAL_RETURN';

CREATE TYPE "InventoryEmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "MaterialReturnStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED');
CREATE TYPE "ReturnedMaterialCondition" AS ENUM ('REUSABLE', 'DAMAGED', 'SCRAP');

ALTER TABLE "RawMaterial"
  ALTER COLUMN "reorderLevel" TYPE DECIMAL(14,3) USING "reorderLevel"::DECIMAL(14,3),
  ALTER COLUMN "openingStockQty" TYPE DECIMAL(14,3) USING "openingStockQty"::DECIMAL(14,3),
  ADD COLUMN "maximumStockLevel" DECIMAL(14,3),
  ADD COLUMN "storageLocation" TEXT,
  ADD COLUMN "binNumber" TEXT;

ALTER TABLE "goods_receipt_note_items"
  ALTER COLUMN "qty" TYPE DECIMAL(14,3) USING "qty"::DECIMAL(14,3);

ALTER TABLE "material_issue_items"
  ALTER COLUMN "qtyIssued" TYPE DECIMAL(14,3) USING "qtyIssued"::DECIMAL(14,3),
  ALTER COLUMN "qtyReturned" TYPE DECIMAL(14,3) USING "qtyReturned"::DECIMAL(14,3);

ALTER TABLE "stock_adjustment_items"
  ALTER COLUMN "qty" TYPE DECIMAL(14,3) USING "qty"::DECIMAL(14,3);

ALTER TABLE "stock_balances"
  ALTER COLUMN "qtyOnHand" TYPE DECIMAL(14,3) USING "qtyOnHand"::DECIMAL(14,3),
  ALTER COLUMN "qtyReserved" TYPE DECIMAL(14,3) USING "qtyReserved"::DECIMAL(14,3),
  ALTER COLUMN "qtyAvailable" TYPE DECIMAL(14,3) USING "qtyAvailable"::DECIMAL(14,3);

ALTER TABLE "stock_ledger"
  ALTER COLUMN "qtyIn" TYPE DECIMAL(14,3) USING "qtyIn"::DECIMAL(14,3),
  ALTER COLUMN "qtyOut" TYPE DECIMAL(14,3) USING "qtyOut"::DECIMAL(14,3),
  ALTER COLUMN "balanceAfter" TYPE DECIMAL(14,3) USING "balanceAfter"::DECIMAL(14,3);

ALTER TABLE "inventory_settings"
  ALTER COLUMN "lowStockThreshold" TYPE DECIMAL(14,3) USING "lowStockThreshold"::DECIMAL(14,3);

CREATE TABLE "inventory_employees" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT,
  "designation" TEXT,
  "phone" TEXT,
  "status" "InventoryEmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdById" TEXT,
  "updatedById" TEXT,
  CONSTRAINT "inventory_employees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_employees_employeeCode_key" ON "inventory_employees"("employeeCode");
CREATE INDEX "inventory_employees_name_idx" ON "inventory_employees"("name");
CREATE INDEX "inventory_employees_department_idx" ON "inventory_employees"("department");
CREATE INDEX "inventory_employees_status_idx" ON "inventory_employees"("status");

ALTER TABLE "material_issues" ADD COLUMN "issuedToEmployeeId" TEXT;
CREATE INDEX "material_issues_issuedToEmployeeId_idx" ON "material_issues"("issuedToEmployeeId");
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_issuedToEmployeeId_fkey"
  FOREIGN KEY ("issuedToEmployeeId") REFERENCES "inventory_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "material_returns" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "returnNo" INTEGER NOT NULL,
  "returnFy" TEXT NOT NULL,
  "status" "MaterialReturnStatus" NOT NULL DEFAULT 'DRAFT',
  "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "materialIssueId" TEXT NOT NULL,
  "returnedByEmployeeId" TEXT,
  "returnedByNameSnapshot" TEXT NOT NULL,
  "receivedByNameSnapshot" TEXT,
  "remarks" TEXT,
  "finalizedAt" TIMESTAMP(3),
  "finalizedById" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  CONSTRAINT "material_returns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "material_returns_returnFy_returnNo_key" ON "material_returns"("returnFy", "returnNo");
CREATE INDEX "material_returns_status_idx" ON "material_returns"("status");
CREATE INDEX "material_returns_returnDate_idx" ON "material_returns"("returnDate");
CREATE INDEX "material_returns_materialIssueId_idx" ON "material_returns"("materialIssueId");
CREATE INDEX "material_returns_returnedByEmployeeId_idx" ON "material_returns"("returnedByEmployeeId");
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_materialIssueId_fkey"
  FOREIGN KEY ("materialIssueId") REFERENCES "material_issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_returnedByEmployeeId_fkey"
  FOREIGN KEY ("returnedByEmployeeId") REFERENCES "inventory_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "material_return_items" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "materialReturnId" TEXT NOT NULL,
  "materialIssueItemId" TEXT NOT NULL,
  "rawMaterialId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "unit" TEXT,
  "qty" DECIMAL(14,3) NOT NULL,
  "condition" "ReturnedMaterialCondition" NOT NULL DEFAULT 'REUSABLE',
  "remarks" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "material_return_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "material_return_items_materialReturnId_sortOrder_idx" ON "material_return_items"("materialReturnId", "sortOrder");
CREATE INDEX "material_return_items_materialIssueItemId_idx" ON "material_return_items"("materialIssueItemId");
CREATE INDEX "material_return_items_rawMaterialId_idx" ON "material_return_items"("rawMaterialId");
ALTER TABLE "material_return_items" ADD CONSTRAINT "material_return_items_materialReturnId_fkey"
  FOREIGN KEY ("materialReturnId") REFERENCES "material_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "material_return_items" ADD CONSTRAINT "material_return_items_materialIssueItemId_fkey"
  FOREIGN KEY ("materialIssueItemId") REFERENCES "material_issue_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_return_items" ADD CONSTRAINT "material_return_items_rawMaterialId_fkey"
  FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
