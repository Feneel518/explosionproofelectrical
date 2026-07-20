CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SENT', 'CANCELLED');

CREATE TABLE "purchase_orders" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "poNo" INTEGER NOT NULL,
  "poFy" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDate" TIMESTAMP(3),
  "supplierId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL,
  "supplierEmail" TEXT,
  "supplierPhone" TEXT,
  "supplierAddress" TEXT,
  "supplierGstin" TEXT,
  "paymentTerms" TEXT,
  "deliveryTerms" TEXT,
  "shippingAddress" TEXT,
  "remarks" TEXT,
  "terms" TEXT,
  "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "taxableTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "gstTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "shippingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "draftData" JSONB,
  "draftVersion" INTEGER NOT NULL DEFAULT 0,
  "finalizedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "sentTo" TEXT,
  "emailSubject" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_order_items" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "rawMaterialId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "supplierItemName" TEXT,
  "itemCode" TEXT,
  "hsnCode" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'Nos',
  "qty" DECIMAL(14,3) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
  "lineSubtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "lineDiscount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "lineTaxable" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "lineGst" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "lineTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "goods_receipt_notes" ADD COLUMN "purchaseOrderId" TEXT;
CREATE UNIQUE INDEX "purchase_orders_poFy_poNo_key" ON "purchase_orders"("poFy", "poNo");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");
CREATE INDEX "purchase_orders_orderDate_idx" ON "purchase_orders"("orderDate");
CREATE INDEX "purchase_order_items_purchaseOrderId_sortOrder_idx" ON "purchase_order_items"("purchaseOrderId", "sortOrder");
CREATE INDEX "purchase_order_items_rawMaterialId_idx" ON "purchase_order_items"("rawMaterialId");
CREATE INDEX "goods_receipt_notes_purchaseOrderId_idx" ON "goods_receipt_notes"("purchaseOrderId");
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
