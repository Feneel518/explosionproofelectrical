import type { Prisma } from "@prisma/client";

/** Only a confirmed Gmail receipt may advance the unchanged, ready-to-send version. */
export async function recordQuotationDelivery(tx: Prisma.TransactionClient, input: {
  requestId: string; quotationId: string; userId: string; expectedUpdatedAt: Date;
  status: "SENT" | "FAILED" | "UNKNOWN"; messageId?: string;
}) {
  if (input.status === "SENT" && !input.messageId) throw new Error("A Gmail receipt is required to mark a quotation as sent.");
  await tx.quotationEmailDelivery.update({ where: { id: input.requestId, userId: input.userId, quotationId: input.quotationId }, data: {
    status: input.status, gmailMessageId: input.messageId, sentAt: input.status === "SENT" ? new Date() : null,
  } });
  if (input.status === "SENT") await tx.quotation.updateMany({
    where: { id: input.quotationId, status: "READY", deletedAt: null, updatedAt: input.expectedUpdatedAt },
    data: { status: "SENT", updatedById: input.userId },
  });
}

export async function quotationStatusAfterOrderUnlink(tx: Prisma.TransactionClient, quotationId: string, nextFollowupAt: Date | null) {
  const quotation = await tx.quotation.findUnique({ where: { id: quotationId }, select: { status: true } });
  if (quotation?.status === "READY" || quotation?.status === "DRAFT") return quotation.status;
  const sent = await tx.quotationEmailDelivery.count({ where: { quotationId, status: "SENT", gmailMessageId: { not: null } } });
  return sent ? nextFollowupAt ? "FOLLOWUP" as const : "SENT" as const : "READY" as const;
}
