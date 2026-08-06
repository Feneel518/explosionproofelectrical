-- The actual casting may be unknown when aluminum is issued. It is selected
-- when the first casting receipt is posted.
ALTER TABLE "casting_job_items"
ALTER COLUMN "outputCastingId" DROP NOT NULL;
