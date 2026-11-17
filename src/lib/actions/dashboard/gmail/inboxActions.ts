"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { DEFAULT_GMAIL_QUERY, GmailApiError, gmailIsConfigured } from "@/lib/gmail/google";
import { syncGmail } from "@/lib/gmail/sync";
import { z } from "zod";

export async function getGmailInboxAction() {
  const { user } = await requireAuth();
  let syncError: string | null = null;
  const configured = gmailIsConfigured();
  if (configured) {
    try { await syncGmail(user.id); } catch (error) {
      syncError = error instanceof GmailApiError ? error.message
        : error instanceof Error && error.message === "too_many_messages" ? "Too many matching messages. Narrow your Gmail filter and try again."
        : "Could not sync Gmail. Please try again shortly.";
    }
  }
  const [connection, notifications, unreadCount] = await Promise.all([
    prisma.gmailConnection.findUnique({ where: { userId: user.id }, select: { email: true, searchQuery: true, lastSyncedAt: true } }),
    prisma.gmailNotification.findMany({ where: { userId: user.id }, orderBy: [{ receivedAt: "desc" }, { id: "desc" }], take: 100 }),
    prisma.gmailNotification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return {
    configured, syncError, unreadCount, defaultQuery: DEFAULT_GMAIL_QUERY,
    connection: connection ? { ...connection, lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null } : null,
    notifications: notifications.map((item) => ({
      id: item.id, subject: item.subject, sender: item.sender, threadId: item.threadId,
      receivedAt: item.receivedAt.toISOString(), createdAt: item.createdAt.toISOString(), read: !!item.readAt,
    })),
  };
}

export type GmailInboxData = Awaited<ReturnType<typeof getGmailInboxAction>>;

export async function markGmailNotificationReadAction(id: string) {
  const { user } = await requireAuth();
  await prisma.gmailNotification.updateMany({
    where: { userId: user.id, id: z.string().uuid().parse(id), readAt: null }, data: { readAt: new Date() },
  });
}

export async function markAllGmailNotificationsReadAction() {
  const { user } = await requireAuth();
  await prisma.gmailNotification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
}

export async function updateGmailFilterAction(query: string) {
  const { user } = await requireAuth();
  const searchQuery = z.string().trim().min(1).max(1000).parse(query);
  await prisma.gmailConnection.update({ where: { userId: user.id }, data: { searchQuery, lastSyncedAt: null, syncLeaseUntil: null } });
}

export async function disconnectGmailAction() {
  const { user } = await requireAuth();
  // Local deletion stops access immediately without revoking the site's Google sign-in grant.
  await prisma.gmailConnection.deleteMany({ where: { userId: user.id } });
}
