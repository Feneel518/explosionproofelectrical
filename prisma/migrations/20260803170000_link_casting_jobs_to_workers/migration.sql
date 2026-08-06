-- Keep the worker name snapshot for historical reporting while linking new
-- casting jobs to the worker master for per-worker issue/receipt tracking.
ALTER TABLE "casting_jobs" ADD COLUMN "workerId" TEXT;

CREATE INDEX "casting_jobs_workerId_idx" ON "casting_jobs"("workerId");

ALTER TABLE "casting_jobs"
ADD CONSTRAINT "casting_jobs_workerId_fkey"
FOREIGN KEY ("workerId") REFERENCES "workers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
