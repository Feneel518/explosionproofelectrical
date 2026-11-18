CREATE TYPE "GmailLeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');
ALTER TABLE "gmail_connections" ADD COLUMN "lastSyncAttemptAt" TIMESTAMP(3), ADD COLUMN "lastSyncError" TEXT;
ALTER TABLE "gmail_notifications"
  ADD COLUMN "snippet" TEXT,
  ADD COLUMN "bodyText" TEXT,
  ADD COLUMN "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "contentIndexedAt" TIMESTAMP(3),
  ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" "GmailLeadStatus" NOT NULL DEFAULT 'NEW',
  ADD COLUMN "internalNote" TEXT;
CREATE TABLE "gmail_thread_links" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "gmail_connections"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  "threadId" TEXT NOT NULL,
  "quotationId" TEXT REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "salesOrderId" TEXT REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gmail_thread_links_one_document" CHECK (("quotationId" IS NOT NULL)::int + ("salesOrderId" IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX "gmail_thread_links_userId_threadId_quotationId_key" ON "gmail_thread_links"("userId", "threadId", "quotationId");
CREATE UNIQUE INDEX "gmail_thread_links_userId_threadId_salesOrderId_key" ON "gmail_thread_links"("userId", "threadId", "salesOrderId");
CREATE INDEX "gmail_thread_links_userId_threadId_idx" ON "gmail_thread_links"("userId", "threadId");
