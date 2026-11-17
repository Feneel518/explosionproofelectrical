"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { getGmailAttachment, gmailAttachmentRequest, GmailAttachmentError, type GmailAttachmentRequest } from "@/lib/gmail/attachments";
import { GmailApiError } from "@/lib/gmail/google";
import { extractOrderPdf, OrderPdfError } from "@/lib/gmail/orderPdf";
import { extractedOrderPdfSchema, reviewedOrderPdfSchema, type ReviewedOrderPdf } from "@/lib/gmail/orderPdfSchema";
import { applyGmailPdfOrderDraft } from "@/lib/gmail/orderPdfDraft";

export async function extractGmailOrderPdfAction(request: GmailAttachmentRequest) {
  const { user } = await requireAuth();
  const input = gmailAttachmentRequest.parse(request);
  const notification = await prisma.gmailNotification.findFirst({ where: { id: input.id, userId: user.id }, select: { id: true, threadId: true } });
  if (!notification) return { ok: false as const, error: "Email not found. Reload the inbox." };
  const key = { userId: user.id, messageId: input.messageId, partId: input.partId };
  const existing = await prisma.gmailPdfImport.findUnique({ where: { userId_messageId_partId: key } });
  if (existing?.threadId !== undefined && existing.threadId !== notification.threadId) return { ok: false as const, error: "This PDF belongs to a different conversation." };
  if (existing?.status === "READY") {
    const result = extractedOrderPdfSchema.safeParse(existing.result);
    if (result.success) return { ok: true as const, id: existing.id, filename: existing.filename, extraction: result.data };
    return { ok: false as const, error: "The saved PDF reading is outdated. Please enter the items manually." };
  }
  const now = new Date();
  if (existing?.status === "FAILED" && now.getTime() - existing.updatedAt.getTime() < 60_000) return { ok: false as const, error: `${existing.error || "The PDF could not be read."} Wait a minute before trying again.` };
  if (!existing && await prisma.gmailPdfImport.count({ where: { userId: user.id, createdAt: { gte: new Date(now.getTime() - 3600_000) } } }) >= 30) return { ok: false as const, error: "You have read 30 PDFs this hour. Please try again later." };
  const job = await prisma.gmailPdfImport.upsert({ where: { userId_messageId_partId: key }, create: { ...key, notificationId: notification.id, threadId: notification.threadId, filename: "Order PDF" }, update: {} });
  const leaseUntil = new Date(now.getTime() + 5 * 60_000);
  const claimed = await prisma.gmailPdfImport.updateMany({ where: { id: job.id, userId: user.id, status: { not: "READY" }, OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] }, data: { status: "PROCESSING", leaseUntil, error: null } });
  if (!claimed.count) return { ok: false as const, error: "This PDF is already being read. Try opening it again in a minute." };
  try {
    const source = await getGmailAttachment(user.id, input, 12 * 1024 * 1024);
    if (source.mimeType !== "application/pdf" && !source.filename.toLowerCase().endsWith(".pdf")) throw new OrderPdfError("Choose a PDF attachment to extract order items.");
    const extraction = await extractOrderPdf(source.bytes, source.filename);
    const saved = await prisma.$transaction(async tx => {
      if (!await tx.gmailConnection.count({ where: { userId: user.id, connectedAt: source.connectedAt } })) return false;
      return (await tx.gmailPdfImport.updateMany({ where: { id: job.id, userId: user.id, leaseUntil }, data: { status: "READY", filename: source.filename, result: extraction as Prisma.InputJsonValue, leaseUntil: null } })).count > 0;
    });
    if (!saved) return { ok: false as const, error: "Mailbox changed. Reload the inbox before reading this PDF." };
    return { ok: true as const, id: job.id, filename: source.filename, extraction };
  } catch (error) {
    const message = error instanceof OrderPdfError || error instanceof GmailAttachmentError || error instanceof GmailApiError ? error.message : "Could not read this PDF. Refresh the inbox and try again.";
    await prisma.gmailPdfImport.updateMany({ where: { id: job.id, userId: user.id, leaseUntil }, data: { status: "FAILED", leaseUntil: null, error: message } });
    return { ok: false as const, error: message };
  }
}

export async function fillOrderFromGmailPdfAction(importId: string, input: ReviewedOrderPdf) {
  const { user } = await requireAuth();
  const id = z.string().uuid().parse(importId);
  const review = reviewedOrderPdfSchema.safeParse(input);
  if (!review.success) return { ok: false as const, error: "Check the selected rows, whole quantities, unit prices, PO date and INR currency, then confirm your review." };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await prisma.$transaction(tx => applyGmailPdfOrderDraft(tx, user.id, id, review.data), { timeout: 20_000 });
      return { ok: true as const, ...order };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002" && attempt < 2) continue;
      return { ok: false as const, error: "The order draft could not be filled. Reload the inbox and try again; existing order items have been preserved." };
    }
  }
  return { ok: false as const, error: "The order draft could not be filled. Please try again." };
}
