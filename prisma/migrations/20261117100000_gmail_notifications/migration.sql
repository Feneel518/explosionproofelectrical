CREATE TABLE "gmail_connections" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncLeaseUntil" TIMESTAMP(3),
    CONSTRAINT "gmail_connections_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "gmail_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "gmail_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "gmail_notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gmail_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gmail_connections"("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "gmail_notifications_userId_messageId_key" ON "gmail_notifications"("userId", "messageId");
CREATE INDEX "gmail_notifications_userId_receivedAt_idx" ON "gmail_notifications"("userId", "receivedAt");
CREATE INDEX "gmail_notifications_userId_readAt_idx" ON "gmail_notifications"("userId", "readAt");
