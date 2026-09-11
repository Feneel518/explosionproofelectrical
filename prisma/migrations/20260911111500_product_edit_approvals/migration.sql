ALTER TYPE "ProductApprovalRequestType" ADD VALUE IF NOT EXISTS 'PRODUCT_UPDATE';
ALTER TYPE "ProductApprovalRequestType" ADD VALUE IF NOT EXISTS 'VARIANT_UPDATE';

ALTER TABLE "product_approval_requests"
ADD COLUMN "targetRecordId" TEXT;

CREATE INDEX "product_approval_requests_type_targetRecordId_status_idx"
ON "product_approval_requests"("type", "targetRecordId", "status");

CREATE UNIQUE INDEX "product_approval_requests_pending_target_key"
ON "product_approval_requests"("type", "targetRecordId")
WHERE "status" = 'PENDING' AND "targetRecordId" IS NOT NULL;
