"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { senderIdentity } from "@/lib/gmail/mime";
import { decryptGmailSecret } from "@/lib/gmail/crypto";
import { exchangeGmailToken } from "@/lib/gmail/google";
import { getQuotationReply } from "@/lib/gmail/quotationReply";

export async function getQuotationReplyOptionsAction(quotationId: string) {
  const { user } = await requireAuth();
  z.string().uuid().parse(quotationId);
  const quotation = await prisma.quotation.findFirst({ where: { id: quotationId, deletedAt: null }, select: { receivedFromEmail: true, customer: { select: { companyEmail: true } } } });
  if (!quotation) throw new Error("Quotation not found.");
  const links = await prisma.gmailThreadLink.findMany({ where: { userId: user.id, quotationId }, select: { threadId: true } });
  const threadIds = links.map((link) => link.threadId);
  const email = (quotation.receivedFromEmail || quotation.customer?.companyEmail || "").trim().toLowerCase();
  const messages = await prisma.gmailNotification.findMany({
    where: { userId: user.id, OR: [{ threadId: { in: threadIds } }, ...(email ? [{ sender: { contains: email, mode: "insensitive" as const } }] : [])] },
    select: { id: true, threadId: true, sender: true, subject: true, receivedAt: true }, orderBy: { receivedAt: "desc" }, take: 100,
  });
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.threadId)) return false;
    if (!threadIds.includes(message.threadId) && senderIdentity(message.sender).email !== email) return false;
    seen.add(message.threadId); return true;
  }).slice(0, 20).map((message) => ({ id: message.id, subject: message.subject, recipient: senderIdentity(message.sender).email,
    receivedAt: message.receivedAt.toISOString(), linked: threadIds.includes(message.threadId) }));
}

export type QuotationReplyOption = Awaited<ReturnType<typeof getQuotationReplyOptionsAction>>[number];

export async function getQuotationReplyContextAction(quotationId: string, notificationId: string) {
  const { user } = await requireAuth();
  z.string().uuid().parse(notificationId);
  const options = await getQuotationReplyOptionsAction(quotationId);
  if (!options.some((option) => option.id === notificationId)) throw new Error("Select an email belonging to this customer or linked quotation.");
  const [connection, notification] = await Promise.all([
    prisma.gmailConnection.findUnique({ where: { userId: user.id } }),
    prisma.gmailNotification.findFirst({ where: { id: notificationId, userId: user.id }, select: { messageId: true, threadId: true } }),
  ]);
  if (!connection || !notification) throw new Error("Reconnect Gmail and select the conversation again.");
  const tokens = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(connection.encryptedRefreshToken) });
  const reply = await getQuotationReply(tokens.access_token, notification.messageId, notification.threadId);
  return { recipient: reply.recipient, subject: reply.subject };
}
