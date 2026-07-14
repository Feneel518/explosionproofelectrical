DO $$
BEGIN
  CREATE TYPE "SalesOrderCompletionType" AS ENUM ('INVOICED', 'MANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "completionType" "SalesOrderCompletionType";
