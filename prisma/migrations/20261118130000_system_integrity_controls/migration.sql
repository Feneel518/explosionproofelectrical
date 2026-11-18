BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "Product" ADD COLUMN "certificationMarking" TEXT, ADD COLUMN "certificationReference" TEXT, ADD COLUMN "certificationVerifiedAt" TIMESTAMP(3);
ALTER TABLE purchase_orders ADD COLUMN "shareTokenHash" TEXT, ADD COLUMN "shareExpiresAt" TIMESTAMP(3);
ALTER TABLE invoices ADD COLUMN "customerSnapshot" JSONB, ADD COLUMN "gstMode" "GST" NOT NULL DEFAULT 'CGST_SGST_18';
ALTER TABLE worker_payouts ADD COLUMN "advanceApplied" DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN "unpaidWagesForward" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Preserve the best available issued identity before customer master data can change again.
-- This cannot reconstruct customer details that changed before this migration.
UPDATE invoices i SET "customerSnapshot" = jsonb_build_object(
  'companyNameSnapshot', COALESCE(c."companyName", i."clientNameSnapshot", so."clientNameSnapshot"),
  'clientNameSnapshot', COALESCE(i."clientNameSnapshot", so."clientNameSnapshot", c."companyName"),
  'citySnapshot', COALESCE(i."citySnapshot", so."citySnapshot", c.city),
  'stateSnapshot', COALESCE(i."stateSnapshot", so."stateSnapshot", c.state),
  'gstinSnapshot', COALESCE(i."gstinSnapshot", so."gstinSnapshot", c.gstin),
  'addressLine1', c."addressLine1", 'addressLine2', c."addressLine2", 'countrySnapshot', c.country, 'pincodeSnapshot', c.pincode,
  'contactNameSnapshot', so."receivedFromName", 'contactPhoneSnapshot', COALESCE(so."receivedFromPhone", c."companyPhone"),
  'contactEmailSnapshot', COALESCE(so."receivedFromEmail", c."companyEmail"), 'source', 'LEGACY_BACKFILL'
) FROM invoices original
LEFT JOIN sales_orders so ON so.id = original."salesOrderId"
LEFT JOIN "Customer" c ON c.id = COALESCE(original."customerId", so."customerId")
WHERE i.id = original.id AND i.status <> 'DRAFT' AND i."customerSnapshot" IS NULL;
UPDATE invoices i SET "gstMode" = so.gst FROM sales_orders so WHERE so.id = i."salesOrderId";

UPDATE worker_payouts SET "advanceApplied" = CASE WHEN "applyAdvances" THEN LEAST("advancesTotal", GREATEST("earningsTotal" + "bonusTotal" - "deductionsTotal", 0)) ELSE 0 END;
UPDATE worker_payouts p SET "unpaidWagesForward" = accumulated.balance FROM (
  SELECT id, SUM(GREATEST("netPayable" - "amountPaid", 0)) OVER (PARTITION BY "workerId" ORDER BY "monthYear") AS balance FROM worker_payouts
) accumulated WHERE accumulated.id = p.id;

CREATE TABLE auth_rate_limits (id TEXT NOT NULL DEFAULT gen_random_uuid(), key TEXT NOT NULL, count INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL, CONSTRAINT auth_rate_limits_pkey PRIMARY KEY (id));
CREATE UNIQUE INDEX auth_rate_limits_key_key ON auth_rate_limits(key);
CREATE TABLE submission_limits (key TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL, CONSTRAINT submission_limits_pkey PRIMARY KEY (key));
CREATE INDEX "submission_limits_expiresAt_idx" ON submission_limits("expiresAt");
CREATE TABLE website_enquiries (
  id TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, company TEXT, "productInterest" TEXT NOT NULL, quantity TEXT, message TEXT NOT NULL,
  source TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'NEW', "deduplicationKey" TEXT NOT NULL, "quotationId" TEXT,
  CONSTRAINT website_enquiries_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "website_enquiries_deduplicationKey_key" ON website_enquiries("deduplicationKey");
CREATE INDEX "website_enquiries_status_createdAt_idx" ON website_enquiries(status, "createdAt");
CREATE TABLE email_outbox (
  id TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deduplicationKey" TEXT NOT NULL,
  recipient TEXT NOT NULL, "replyTo" TEXT, subject TEXT NOT NULL, html TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', attempts INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lockedUntil" TIMESTAMP(3), "sentAt" TIMESTAMP(3), "lastError" TEXT,
  CONSTRAINT email_outbox_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "email_outbox_deduplicationKey_key" ON email_outbox("deduplicationKey");
CREATE INDEX "email_outbox_status_nextAttemptAt_idx" ON email_outbox(status, "nextAttemptAt");
COMMIT;
