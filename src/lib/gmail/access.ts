import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "./crypto";
import { exchangeGmailToken, gmailGet } from "./google";
import { type GmailMessage } from "./mime";

export async function gmailAccess(userId: string) {
  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!connection) throw new Error("Connect Gmail before opening messages.");
  const { access_token } = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(connection.encryptedRefreshToken) });
  return { accessToken: access_token, email: connection.email, connectedAt: connection.connectedAt };
}

export async function ownedGmailMessage(userId: string, notificationId: string, messageId?: string) {
  const notification = await prisma.gmailNotification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) throw new Error("Email not found.");
  const access = await gmailAccess(userId);
  const message = await gmailGet<GmailMessage>(access.accessToken, `messages/${encodeURIComponent(messageId || notification.messageId)}?format=full`);
  if (message.threadId !== notification.threadId) throw new Error("Attachment does not belong to this conversation.");
  if (!await prisma.gmailConnection.count({ where: { userId, connectedAt: access.connectedAt } })) throw new Error("Mailbox changed. Reload the inbox.");
  return { notification, message, ...access };
}
