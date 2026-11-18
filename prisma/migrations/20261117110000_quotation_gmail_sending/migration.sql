ALTER TABLE "gmail_connections" ADD COLUMN "grantedScopes" TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/gmail.readonly';

CREATE TABLE "quotation_email_deliveries" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gmailMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "quotation_email_deliveries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotation_email_deliveries_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotation_email_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "quotation_email_deliveries_quotationId_userId_createdAt_idx" ON "quotation_email_deliveries"("quotationId", "userId", "createdAt");
