CREATE TYPE "ProductApprovalRequestType" AS ENUM ('PRODUCT_CREATE', 'VARIANT_CREATE');
CREATE TYPE "ProductApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "product_approval_requests" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "type" "ProductApprovalRequestType" NOT NULL,
  "status" "ProductApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "requesterId" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdRecordId" TEXT,
  CONSTRAINT "product_approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_approval_settings" (
  "id" TEXT NOT NULL DEFAULT 'product-approval',
  "approvalEmail" TEXT NOT NULL DEFAULT 'feneelp@gmail.com',
  "requireProductApproval" BOOLEAN NOT NULL DEFAULT true,
  "requireVariantApproval" BOOLEAN NOT NULL DEFAULT true,
  "sendEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_approval_settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_approval_requests_status_createdAt_idx" ON "product_approval_requests"("status", "createdAt");
CREATE INDEX "product_approval_requests_requesterId_idx" ON "product_approval_requests"("requesterId");

ALTER TABLE "product_approval_requests"
ADD CONSTRAINT "product_approval_requests_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_approval_requests"
ADD CONSTRAINT "product_approval_requests_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "product_approval_settings" ("id", "approvalEmail", "requireProductApproval", "requireVariantApproval", "sendEmailNotifications", "updatedAt")
VALUES ('product-approval', 'feneelp@gmail.com', true, true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
