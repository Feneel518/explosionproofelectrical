import type { Prisma } from "@prisma/client";

/** Only a confirmed Gmail receipt may advance the unchanged, ready-to-send version. */
export async function recordQuotationDelivery(tx: Prisma.TransactionClient, input: {
  requestId: string; quotationId: string; userId: string; expectedUpdatedAt: Date;
  status: "SENT" | "FAILED" | "UNKNOWN"; messageId?: string;
  followupAt?: Date | null;
}) {
  if (input.status === "SENT" && !input.messageId) throw new Error("A Gmail receipt is required to mark a quotation as sent.");
  await tx.quotationEmailDelivery.update({ where: { id: input.requestId, userId: input.userId, quotationId: input.quotationId }, data: {
    status: input.status, gmailMessageId: input.messageId, sentAt: input.status === "SENT" ? new Date() : null,
  } });
  if (input.status !== "SENT") return { followupScheduled: false };
  await tx.$executeRaw`SELECT id FROM quotations WHERE id = ${input.quotationId} FOR UPDATE`;
  const quotation = await tx.quotation.findUnique({ where: { id: input.quotationId }, select: { status: true, updatedAt: true, deletedAt: true } });
  if (!quotation || quotation.deletedAt || quotation.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) return { followupScheduled: false };
  await tx.quotation.updateMany({
    where: { id: input.quotationId, status: "READY", deletedAt: null, updatedAt: input.expectedUpdatedAt },
    data: { status: "SENT", updatedById: input.userId },
  });
  if (!input.followupAt || !["READY", "SENT", "FOLLOWUP"].includes(quotation.status)) return { followupScheduled: false };
  const note = "Follow up on emailed quotation";
  const existing = await tx.quotationFollowup.findFirst({ where: { quotationId: input.quotationId, note, scheduledAt: input.followupAt, doneAt: null }, select: { id: true } });
  if (!existing) await tx.quotationFollowup.create({ data: { quotationId: input.quotationId, scheduledAt: input.followupAt, note, createdById: input.userId } });
  const next = await tx.quotationFollowup.findFirst({ where: { quotationId: input.quotationId, doneAt: null }, orderBy: { scheduledAt: "asc" }, select: { scheduledAt: true } });
  await tx.quotation.update({ where: { id: input.quotationId }, data: { nextFollowupAt: next?.scheduledAt || null } });
  return { followupScheduled: true };
}

export async function quotationStatusAfterOrderUnlink(tx: Prisma.TransactionClient, quotationId: string, nextFollowupAt: Date | null) {
  const quotation = await tx.quotation.findUnique({ where: { id: quotationId }, select: { status: true } });
  if (quotation?.status === "READY" || quotation?.status === "DRAFT") return quotation.status;
  const sent = await tx.quotationEmailDelivery.count({ where: { quotationId, status: "SENT", gmailMessageId: { not: null } } });
  return sent ? nextFollowupAt ? "FOLLOWUP" as const : "SENT" as const : "READY" as const;
}
