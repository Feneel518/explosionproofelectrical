import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/db";

const filterSchema = z.object({
  page: z.number().int().min(1).max(1_000_000).default(1),
  search: z.string().trim().max(200).default(""),
  read: z.enum(["ALL", "UNREAD", "READ"]).default("ALL"),
});
export type GmailAlertFilters = z.input<typeof filterSchema>;
export const GMAIL_ALERT_PAGE_SIZE = 100;

export async function loadGmailAlerts(userId: string, input: GmailAlertFilters = {}) {
  const filters = filterSchema.parse(input);
  const where: Prisma.GmailNotificationWhereInput = {
    userId,
    ...(filters.search ? { OR: [
      { subject: { contains: filters.search, mode: "insensitive" as const } },
      { sender: { contains: filters.search, mode: "insensitive" as const } },
    ] } : {}),
    ...(filters.read === "UNREAD" ? { readAt: null } : filters.read === "READ" ? { readAt: { not: null } } : {}),
  };
  const total = await prisma.gmailNotification.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / GMAIL_ALERT_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const rows = await prisma.gmailNotification.findMany({
    where, orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
    take: GMAIL_ALERT_PAGE_SIZE, skip: (page - 1) * GMAIL_ALERT_PAGE_SIZE,
  });
  return {
    notifications: rows.map(item => ({
      id: item.id, subject: item.subject, sender: item.sender, threadId: item.threadId,
      receivedAt: item.receivedAt.toISOString(), createdAt: item.createdAt.toISOString(), read: !!item.readAt,
    })),
    pagination: { page, pageSize: GMAIL_ALERT_PAGE_SIZE, total, totalPages },
  };
}
