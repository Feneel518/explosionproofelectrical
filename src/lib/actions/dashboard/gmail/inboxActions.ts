"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { DEFAULT_GMAIL_QUERY, GmailApiError, gmailCanSend, gmailIsConfigured } from "@/lib/gmail/google";
import { syncGmail } from "@/lib/gmail/sync";
import { z } from "zod";
import { loadGmailAlerts, type GmailAlertFilters } from "@/lib/gmail/alerts";
import { consumeSubmissionLimit, SubmissionLimitError } from "@/lib/security/submissionLimit";

export async function getGmailInboxAction(options: GmailAlertFilters & { rescan?: boolean } = {}) {
  const { user } = await requirePermission("sales.write");
  let syncError: string | null = null;
  const configured = gmailIsConfigured();
  if (configured) {
    try {
      const rescan = z.boolean().optional().parse(options.rescan) ?? false;
      if (rescan) await consumeSubmissionLimit("gmail-rescan", user.id, 3, 60);
      await syncGmail(user.id, { rescan });
    } catch (error) {
      syncError = error instanceof GmailApiError ? error.message
        : error instanceof SubmissionLimitError ? error.message
        : error instanceof Error && error.message === "too_many_messages" ? "Too many matching messages. Narrow your Gmail filter and try again."
        : "Could not sync Gmail. Please try again shortly.";
    }
  }
  const [connection, alerts, unreadCount, unreadRows] = await Promise.all([
    prisma.gmailConnection.findUnique({ where: { userId: user.id }, select: { email: true, grantedScopes: true, searchQuery: true, lastSyncedAt: true } }),
    loadGmailAlerts(user.id, options),
    prisma.gmailNotification.count({ where: { userId: user.id, readAt: null } }),
    prisma.gmailNotification.findMany({ where: { userId: user.id, readAt: null }, orderBy: [{ receivedAt: "desc" }, { id: "desc" }], take: 3,
      select: { id: true, subject: true, sender: true, threadId: true, receivedAt: true } }),
  ]);
  return {
    configured, syncError, unreadCount, defaultQuery: DEFAULT_GMAIL_QUERY,
    connection: connection ? { email: connection.email, searchQuery: connection.searchQuery, canSend: gmailCanSend(connection.grantedScopes), lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null } : null,
    ...alerts,
    unreadPreview: unreadRows.map(item => ({ id: item.id, subject: item.subject, sender: item.sender, threadId: item.threadId, receivedAt: item.receivedAt.toISOString() })),
  };
}

export type GmailInboxData = Awaited<ReturnType<typeof getGmailInboxAction>>;

export async function getGmailAlertsAction(filters: GmailAlertFilters = {}) {
  const { user } = await requirePermission("sales.read");
  return loadGmailAlerts(user.id, filters);
}

export async function markGmailNotificationReadAction(id: string) {
  const { user } = await requirePermission("sales.write");
  await prisma.gmailNotification.updateMany({
    where: { userId: user.id, id: z.string().uuid().parse(id), readAt: null }, data: { readAt: new Date() },
  });
}

export async function markAllGmailNotificationsReadAction() {
  const { user } = await requirePermission("sales.write");
  await prisma.gmailNotification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
}

export async function updateGmailFilterAction(query: string) {
  const { user } = await requirePermission("sales.write");
  const searchQuery = z.string().trim().min(1).max(1000).parse(query);
  await prisma.gmailConnection.update({ where: { userId: user.id }, data: { searchQuery, lastSyncedAt: null, syncLeaseUntil: null } });
}

export async function disconnectGmailAction() {
  const { user } = await requirePermission("sales.write");
  // Local deletion stops access immediately without revoking the site's Google sign-in grant.
  await prisma.gmailConnection.deleteMany({ where: { userId: user.id } });
}
