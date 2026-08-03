CREATE TYPE "ProductSerialStatus" AS ENUM ('AVAILABLE', 'INVOICED', 'VOID');

ALTER TABLE "Product"
ADD COLUMN "serialPrefix" TEXT,
ADD COLUMN "serialTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Product_serialPrefix_key" ON "Product"("serialPrefix");

CREATE TABLE "product_serial_counters" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_serial_counters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_serials" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "ProductSerialStatus" NOT NULL DEFAULT 'AVAILABLE',
    "invoiceItemId" TEXT,
    "invoicedAt" TIMESTAMP(3),
    CONSTRAINT "product_serials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_serial_counters_productId_year_key" ON "product_serial_counters"("productId", "year");
CREATE UNIQUE INDEX "product_serials_serialNumber_key" ON "product_serials"("serialNumber");
CREATE UNIQUE INDEX "product_serials_productId_year_sequence_key" ON "product_serials"("productId", "year", "sequence");
CREATE INDEX "product_serials_productId_status_sequence_idx" ON "product_serials"("productId", "status", "sequence");
CREATE INDEX "product_serials_batchId_idx" ON "product_serials"("batchId");
CREATE INDEX "product_serials_invoiceItemId_idx" ON "product_serials"("invoiceItemId");

ALTER TABLE "product_serial_counters" ADD CONSTRAINT "product_serial_counters_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "invoice_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
