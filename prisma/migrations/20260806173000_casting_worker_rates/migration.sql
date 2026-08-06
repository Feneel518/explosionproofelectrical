CREATE TABLE "casting_worker_rates" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "workerId" TEXT NOT NULL,
  "castingMasterId" TEXT NOT NULL,
  "ratePerKg" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "casting_worker_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "casting_worker_rates_workerId_castingMasterId_key" ON "casting_worker_rates"("workerId", "castingMasterId");
CREATE INDEX "casting_worker_rates_workerId_idx" ON "casting_worker_rates"("workerId");
CREATE INDEX "casting_worker_rates_castingMasterId_idx" ON "casting_worker_rates"("castingMasterId");

ALTER TABLE "casting_worker_rates" ADD CONSTRAINT "casting_worker_rates_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "casting_worker_rates" ADD CONSTRAINT "casting_worker_rates_castingMasterId_fkey" FOREIGN KEY ("castingMasterId") REFERENCES "casting_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "casting_job_receipt_items"
ADD COLUMN "ratePerKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "laborAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
