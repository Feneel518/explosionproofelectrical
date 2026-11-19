"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "@/lib/gmail/crypto";
import { exchangeGmailToken, GmailApiError } from "@/lib/gmail/google";
import { getGmailAttachmentMessage, getGmailPdf, listGmailPdfs } from "@/lib/gmail/attachments";
import { parseGmailMessage } from "@/lib/gmail/mime";
import { findMailProductSuggestions, findMailSalesSuggestions } from "@/lib/gmail/suggestionService";
import { linkSalesConversation } from "@/lib/gmail/salesConversation";
import { consumeSubmissionLimit } from "@/lib/security/submissionLimit";

async function ownedAlert(userId: string, notificationId: string) {
  const alert = await prisma.gmailNotification.findFirst({ where: { id: z.string().uuid().parse(notificationId), userId },
    select: { id: true, messageId: true, threadId: true, subject: true, sender: true, bodyText: true, connection: { select: { encryptedRefreshToken: true } } } });
  if (!alert) throw new Error("Email not found. Refresh your inbox and try again.");
  return alert;
}

async function loadMessage(alert: Awaited<ReturnType<typeof ownedAlert>>) {
  const tokens = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(alert.connection.encryptedRefreshToken) });
  return { accessToken: tokens.access_token, message: await getGmailAttachmentMessage(tokens.access_token, alert.messageId) };
}

export async function getGmailSuggestionsAction(notificationId: string) {
  const { user } = await requirePermission("sales.read");
  const alert = await ownedAlert(user.id, notificationId);
  let body = alert.bodyText || "";
  let attachments: ReturnType<typeof listGmailPdfs> = [];
  let warning: string | null = null;
  try {
    const { message } = await loadMessage(alert);
    body = parseGmailMessage(message).bodyText;
    attachments = listGmailPdfs(message);
  } catch (error) {
    warning = error instanceof GmailApiError ? error.message : "Email content could not be loaded. Suggestions use the saved subject and sender. Retry to include the email and PDFs.";
  }
  const [sales, products] = await Promise.all([
    findMailSalesSuggestions(prisma, user.id, alert.threadId, alert.subject, alert.sender, body),
    findMailProductSuggestions(prisma, `${alert.subject}\n${body}`),
  ]);
  return { ...sales, products, attachments, warning };
}

export async function searchGmailSalesSuggestionsAction(notificationId: string, query: string) {
  const { user } = await requirePermission("sales.read");
  const alert = await ownedAlert(user.id, notificationId);
  const value = z.string().trim().min(2).max(200).parse(query);
  return findMailSalesSuggestions(prisma, user.id, alert.threadId, alert.subject, alert.sender, "", value);
}

export async function linkGmailSalesSuggestionAction(notificationId: string, kind: "ORDER" | "QUOTATION", recordId: string) {
  const { user } = await requirePermission("sales.write");
  const id = z.string().uuid().parse(notificationId);
  const targetId = z.string().uuid().parse(recordId);
  const targetKind = z.enum(["ORDER", "QUOTATION"]).parse(kind);
  await prisma.$transaction(async tx => {
    const alert = await tx.gmailNotification.findFirst({ where: { id, userId: user.id }, select: { threadId: true } });
    if (!alert) throw new Error("Email not found. Refresh your inbox and try again.");
    await linkSalesConversation(tx, user.id, alert.threadId, targetKind, targetId);
  });
  return { success: true };
}

export async function extractGmailProductSuggestionsAction(notificationId: string, options: { partId?: string; text?: string }) {
  const { user } = await requirePermission("sales.read");
  const input = z.object({ partId: z.string().regex(/^\d+(?:\.\d+)*$/).optional(), text: z.string().trim().min(2).max(50_000).optional() })
    .refine(value => !!value.partId !== !!value.text, "Choose a PDF or enter a product description.").parse(options);
  const alert = await ownedAlert(user.id, notificationId);
  let text = input.text ?? "";
  let warning: string | null = null;
  if (input.partId) {
    await consumeSubmissionLimit("gmail-pdf-suggestions", user.id, 15, 60);
    const { accessToken, message } = await loadMessage(alert);
    const { bytes } = await getGmailPdf(accessToken, message, input.partId);
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    try {
      const result = await parser.getText({ first: 30, pageJoiner: "" });
      text = result.text.slice(0, 50_000);
      if (result.total > 30 || result.text.length > 50_000) warning = "Only the first 30 pages and 50,000 characters were checked. Paste additional item descriptions below to search them.";
    } finally { await parser.destroy(); }
    if (!text.trim()) warning = "This PDF has no readable text. Paste the product descriptions below to find catalog suggestions.";
  }
  const [products, sales] = await Promise.all([
    findMailProductSuggestions(prisma, text),
    findMailSalesSuggestions(prisma, user.id, alert.threadId, alert.subject, alert.sender, text),
  ]);
  return { products, ...sales, warning };
}
