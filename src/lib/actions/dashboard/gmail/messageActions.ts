"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { gmailAccess } from "@/lib/gmail/access";
import { getGmailConversationContent, type GmailConversationContent } from "@/lib/gmail/conversation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const inboxFilters = z.object({
  search: z.string().trim().max(250).default(""), sender: z.string().trim().max(250).default(""),
  read: z.enum(["ALL", "UNREAD", "READ"]).default("ALL"),
  status: z.enum(["ALL", "NEW", "IN_PROGRESS", "DONE"]).default("ALL"),
  attachment: z.boolean().default(false), starred: z.boolean().default(false),
  linked: z.enum(["ALL", "LINKED", "UNLINKED"]).default("ALL"),
  from: z.string().max(10).default(""), to: z.string().max(10).default(""),
  page: z.number().int().min(1).max(100_000).default(1),
});
export type InboxFilters = z.input<typeof inboxFilters>;

function filterDate(value: string, end = false) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date filter.");
  const date = new Date(`${value}T00:00:00+05:30`);
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 19_800_000).toISOString().slice(0, 10) !== value) throw new Error("Invalid date filter.");
  return end ? new Date(date.getTime() + 86_400_000) : date;
}

export async function listGmailMessagesAction(input: InboxFilters = {}) {
  const { user } = await requireAuth();
  const filters = inboxFilters.parse(input);
  const linkedThreads = filters.linked !== "ALL" ? await prisma.gmailThreadLink.findMany({ where: { userId: user.id, OR: [{ quotation: { deletedAt: null } }, { salesOrder: { deletedAt: null } }] }, select: { threadId: true }, distinct: ["threadId"] }) : [];
  const where: Prisma.GmailNotificationWhereInput = {
    userId: user.id,
    ...(filters.search ? { OR: ["subject", "sender", "snippet", "bodyText", "internalNote"].map(field => ({ [field]: { contains: filters.search, mode: "insensitive" } })) } : {}),
    ...(filters.sender ? { sender: { contains: filters.sender, mode: "insensitive" } } : {}),
    ...(filters.read !== "ALL" ? { readAt: filters.read === "UNREAD" ? null : { not: null } } : {}),
    ...(filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.attachment ? { hasAttachments: true } : {}),
    ...(filters.starred ? { starred: true } : {}),
    ...(filters.linked === "LINKED" ? { threadId: { in: linkedThreads.map(t => t.threadId) } } : filters.linked === "UNLINKED" ? { threadId: { notIn: linkedThreads.map(t => t.threadId) } } : {}),
    ...(filters.from || filters.to ? { receivedAt: { gte: filterDate(filters.from), lt: filterDate(filters.to, true) } } : {}),
  };
  const pageSize = 30;
  const [rows, total, unindexed] = await Promise.all([
    prisma.gmailNotification.findMany({ where, orderBy: [{ receivedAt: "desc" }, { id: "desc" }], skip: (filters.page - 1) * pageSize, take: pageSize, select: {
      id: true, threadId: true, subject: true, sender: true, snippet: true, receivedAt: true, readAt: true, hasAttachments: true, starred: true, status: true,
    } }),
    prisma.gmailNotification.count({ where }),
    prisma.gmailNotification.count({ where: { userId: user.id, contentIndexedAt: null } }),
  ]);
  const links = await prisma.gmailThreadLink.findMany({ where: { userId: user.id, threadId: { in: rows.map(row => row.threadId) } }, select: {
    threadId: true, quotation: { select: { quoteFy: true, quoteNo: true, deletedAt: true } }, salesOrder: { select: { orderFy: true, orderNo: true, deletedAt: true } },
  } });
  return { total, pageSize, unindexed, messages: rows.map(row => ({ ...row, receivedAt: row.receivedAt.toISOString(), read: !!row.readAt,
    links: links.filter(link => link.threadId === row.threadId).flatMap(link => link.quotation && !link.quotation.deletedAt ? [`Quote ${link.quotation.quoteFy}/${link.quotation.quoteNo}`] : link.salesOrder && !link.salesOrder.deletedAt ? [`Order ${link.salesOrder.orderFy}/${link.salesOrder.orderNo}`] : []),
  })) };
}
export type InboxPageData = Awaited<ReturnType<typeof listGmailMessagesAction>>;

export async function getGmailConversationAction(id: string, beforeMessageId?: string, forceRefresh = false) {
  const { user } = await requireAuth();
  const notification = await prisma.gmailNotification.findFirst({ where: { id: z.string().uuid().parse(id), userId: user.id } });
  if (!notification) throw new Error("Email not found.");
  z.boolean().parse(forceRefresh);
  const connection = await prisma.gmailConnection.findUniqueOrThrow({ where: { userId: user.id }, select: { email: true, connectedAt: true } });
  const cache = await prisma.gmailConversationCache.findUnique({ where: { userId_threadId: { userId: user.id, threadId: notification.threadId } } });
  const saved = cache && cache.fetchedAt >= connection.connectedAt ? cache.content as unknown as GmailConversationContent : undefined;
  if (beforeMessageId) z.string().max(200).parse(beforeMessageId);
  const fresh = saved && !beforeMessageId && !forceRefresh && Date.now() - cache!.fetchedAt.getTime() < 120_000;
  const content = fresh ? saved : await getGmailConversationContent((await gmailAccess(user.id)).accessToken, notification, beforeMessageId, saved);
  if (!await prisma.gmailConnection.count({ where: { userId: user.id, connectedAt: connection.connectedAt } })) throw new Error("Mailbox changed. Reload the inbox.");
  if (!fresh && !beforeMessageId && !content.warning && JSON.stringify(content).length < 2_000_000) {
    await prisma.$transaction(async tx => {
      if (!await tx.gmailConnection.count({ where: { userId: user.id, connectedAt: connection.connectedAt } })) return;
      await tx.gmailConversationCache.upsert({ where: { userId_threadId: { userId: user.id, threadId: notification.threadId } }, create: { userId: user.id, threadId: notification.threadId, content: content as Prisma.InputJsonValue }, update: { content: content as Prisma.InputJsonValue, fetchedAt: new Date() } });
    });
  }
  const messages = content.messages;
  const original = messages.find(message => message.messageId === notification.messageId);
  await prisma.gmailNotification.updateMany({ where: { id, userId: user.id }, data: { readAt: notification.readAt || new Date(), ...(original && !content.warning ? {
    bodyText: original.bodyText, snippet: original.snippet, hasAttachments: original.hasAttachments, contentIndexedAt: new Date(),
  } : {}) } });
  return { id, email: connection.email, threadId: notification.threadId, subject: notification.subject, starred: notification.starred,
    status: notification.status, internalNote: notification.internalNote || "", ...content };

}
export type GmailConversation = Awaited<ReturnType<typeof getGmailConversationAction>>;

export async function updateGmailMessageAction(id: string, input: { starred?: boolean; status?: "NEW" | "IN_PROGRESS" | "DONE"; internalNote?: string; read?: boolean }) {
  const { user } = await requireAuth();
  const patch = z.object({ starred: z.boolean().optional(), status: z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional(), internalNote: z.string().trim().max(10_000).optional(), read: z.boolean().optional() }).strict().parse(input);
  const { read, ...values } = patch;
  await prisma.gmailNotification.updateMany({ where: { id: z.string().uuid().parse(id), userId: user.id }, data: { ...values, ...(read !== undefined ? { readAt: read ? new Date() : null } : {}) } });
}

