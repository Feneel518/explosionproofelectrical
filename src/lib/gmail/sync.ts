import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "./crypto";
import { buildGmailSearch, exchangeGmailToken } from "./google";
import { getMatchingGmailMessages } from "./messages";

export async function syncGmail(userId: string, { rescan = false }: { rescan?: boolean } = {}) {
  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!connection) return;
  const now = new Date();
  if (!rescan && connection.lastSyncedAt && now.getTime() - connection.lastSyncedAt.getTime() < 55_000) return;
  const syncLeaseUntil = new Date(now.getTime() + 5 * 60_000);
  const lease = await prisma.gmailConnection.updateMany({
    where: { userId, connectedAt: connection.connectedAt, searchQuery: connection.searchQuery, lastSyncedAt: connection.lastSyncedAt, OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lt: now } }] },
    data: { syncLeaseUntil, lastSyncAttemptAt: now },
  });
  if (!lease.count) return;
  try {
    const tokens = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(connection.encryptedRefreshToken) });
    const messages = await getMatchingGmailMessages(tokens.access_token, buildGmailSearch(connection.searchQuery, rescan ? null : connection.lastSyncedAt, now));
    await prisma.$transaction(async (tx) => {
      // A disconnect, reconnect or filter change during a fetch invalidates this sync.
      const current = await tx.gmailConnection.updateMany({
        where: { userId, connectedAt: connection.connectedAt, searchQuery: connection.searchQuery, syncLeaseUntil },
        data: { lastSyncedAt: now, syncLeaseUntil: null },
      });
      if (!current.count) return;
      if (messages.length) await tx.gmailNotification.createMany({
        data: messages.map((message) => ({ ...message, userId })), skipDuplicates: true,
      });
    });
  } finally {
    await prisma.gmailConnection.updateMany({ where: { userId, syncLeaseUntil }, data: { syncLeaseUntil: null } });
  }
}
