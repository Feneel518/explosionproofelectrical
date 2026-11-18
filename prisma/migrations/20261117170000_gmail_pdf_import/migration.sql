CREATE TABLE "gmail_conversation_caches" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "gmail_connections"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  "threadId" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "gmail_conversation_caches_userId_threadId_key" ON "gmail_conversation_caches"("userId", "threadId");
CREATE TABLE "gmail_pdf_imports" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "gmail_connections"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  "notificationId" TEXT NOT NULL REFERENCES "gmail_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "messageId" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "partId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "leaseUntil" TIMESTAMP(3),
  "result" JSONB,
  "error" TEXT,
  "orderId" TEXT REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "gmail_pdf_imports_userId_messageId_partId_key" ON "gmail_pdf_imports"("userId", "messageId", "partId");
CREATE INDEX "gmail_pdf_imports_userId_createdAt_idx" ON "gmail_pdf_imports"("userId", "createdAt");
