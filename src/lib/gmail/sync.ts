import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "./crypto";
import { buildGmailSearch, exchangeGmailToken } from "./google";
import { getMatchingGmailMessages } from "./messages";
import { gmailGet, GmailApiError } from "./google";
import { parseGmailMessage, type GmailMessage } from "./mime";

export async function syncGmail(userId: string) {
  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!connection) return;
  const now = new Date();
  if (connection.lastSyncAttemptAt && now.getTime() - connection.lastSyncAttemptAt.getTime() < 55_000) return;
  const syncLeaseUntil = new Date(now.getTime() + 5 * 60_000);
  const lease = await prisma.gmailConnection.updateMany({
    where: { userId, connectedAt: connection.connectedAt, OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lt: now } }] },
    data: { syncLeaseUntil, lastSyncAttemptAt: now },
  });
  if (!lease.count) return;
  try {
    const tokens = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(connection.encryptedRefreshToken) });
    const { messages, complete } = await getMatchingGmailMessages(tokens.access_token, buildGmailSearch(connection.searchQuery, connection.lastSyncedAt, now), {
      limit: 30,
      unknownIds: async ids => {
        const imported = await prisma.gmailNotification.findMany({ where: { userId, messageId: { in: ids } }, select: { messageId: true } });
        const known = new Set(imported.map(row => row.messageId));
        return ids.filter(id => !known.has(id));
      },
    });
    // Gradually index alerts imported by the original metadata-only integration.
    const unindexed = await prisma.gmailNotification.findMany({ where: { userId, contentIndexedAt: null }, take: 10, select: { id: true, messageId: true } });
    const indexed = await Promise.all(unindexed.map(async row => {
      try {
        const message = parseGmailMessage(await gmailGet<GmailMessage>(tokens.access_token, `messages/${encodeURIComponent(row.messageId)}?format=full`));
        return { id: row.id, snippet: message.snippet, bodyText: message.bodyText, hasAttachments: message.hasAttachments };
      } catch (error) {
        // A message deleted in Gmail should not block the rest of the mailbox.
        if (error instanceof GmailApiError && error.status === 404) return { id: row.id, snippet: "Message no longer available in Gmail.", bodyText: "", hasAttachments: false };
        throw error;
      }
    }));
    await prisma.$transaction(async (tx) => {
      // A disconnect, reconnect or filter change during a fetch invalidates this sync.
      const current = await tx.gmailConnection.updateMany({
        where: { userId, connectedAt: connection.connectedAt, searchQuery: connection.searchQuery, syncLeaseUntil },
        // Keep the search checkpoint until all new matches have been imported.
        data: { ...(complete ? { lastSyncedAt: now } : {}), lastSyncError: null, syncLeaseUntil: null },
      });
      if (!current.count) return;
      if (messages.length) await tx.gmailNotification.createMany({
        data: messages.map((message) => ({ ...message, userId })), skipDuplicates: true,
      });
      for (const { id, ...content } of indexed) await tx.gmailNotification.updateMany({ where: { id, userId }, data: { ...content, contentIndexedAt: now } });
    }, { timeout: 20_000 });
  } catch (error) {
    await prisma.gmailConnection.updateMany({ where: { userId, connectedAt: connection.connectedAt, syncLeaseUntil }, data: {
      lastSyncError: error instanceof GmailApiError ? error.message : "Email sync failed. Try again, or reconnect Gmail if access has expired.",
    } });
    throw error;
  } finally {
    await prisma.gmailConnection.updateMany({ where: { userId, syncLeaseUntil }, data: { syncLeaseUntil: null } });
  }
}
