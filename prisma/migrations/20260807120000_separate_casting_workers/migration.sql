CREATE TYPE "WorkerKind" AS ENUM ('MACHINING', 'CASTING');

ALTER TABLE "workers"
ADD COLUMN "kind" "WorkerKind" NOT NULL DEFAULT 'MACHINING';

UPDATE "workers" SET "kind" = 'CASTING'
WHERE "id" IN (
  SELECT "workerId" FROM "casting_jobs" WHERE "workerId" IS NOT NULL
  UNION
  SELECT "workerId" FROM "casting_worker_rates"
);

CREATE INDEX "workers_kind_idx" ON "workers"("kind");
