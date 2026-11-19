import { z } from "zod";
import { prisma } from "@/lib/prisma/db";
import { ownedGmailMessage } from "./access";

import { gmailGet } from "./google";
import { flattenParts, type GmailMessage, type GmailPart } from "./mime";

export const MAX_GMAIL_PDF_BYTES = 25 * 1024 * 1024;
export type GmailPdfAttachment = { partId: string; filename: string; size: number };

export class GmailAttachmentError extends Error {
  public status: number;
  constructor(status: number | string, message?: string) { super(typeof status === "string" ? status : message); this.status = typeof status === "number" ? status : 400; }
}

function isPdf(part: GmailPart) {
  const mime = part.mimeType?.split(";")[0].trim().toLowerCase();
  return mime === "application/pdf" || (mime === "application/octet-stream" && /\.pdf$/i.test(part.filename ?? ""));
}

export async function getGmailAttachmentMessage(accessToken: string, messageId: string) {
  return gmailGet<GmailMessage>(accessToken, `messages/${encodeURIComponent(messageId)}?format=full`);
}

export function listGmailPdfs(message: GmailMessage): GmailPdfAttachment[] {
  return flattenParts(message.payload).filter(isPdf).map(part => ({
    partId: part.partId || "0", filename: part.filename || "Attachment.pdf", size: part.body?.size ?? 0,
  }));
}

export async function getGmailPdf(accessToken: string, message: GmailMessage, partId: string) {
  const part = flattenParts(message.payload).find(part => (part.partId || "0") === partId && isPdf(part));
  if (!part) throw new GmailAttachmentError(404, "This PDF attachment is no longer available. Open the email in Gmail to check it.");
  if ((part.body?.size ?? 0) > MAX_GMAIL_PDF_BYTES) throw new GmailAttachmentError(413, "This PDF is larger than the 25 MB preview limit. Open it in Gmail instead.");
  const body = part.body?.attachmentId
    ? await gmailGet<{ data?: string; size?: number }>(accessToken, `messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(part.body.attachmentId)}`)
    : part.body;
  if ((body?.size ?? 0) > MAX_GMAIL_PDF_BYTES || (body?.data?.length ?? 0) > Math.ceil(MAX_GMAIL_PDF_BYTES / 3) * 4) {
    throw new GmailAttachmentError(413, "This PDF is larger than the 25 MB preview limit. Open it in Gmail instead.");
  }
  const bytes = Buffer.from(body?.data ?? "", "base64url");
  if (bytes.length > MAX_GMAIL_PDF_BYTES) throw new GmailAttachmentError(413, "This PDF is larger than the 25 MB preview limit. Open it in Gmail instead.");
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new GmailAttachmentError(415, "This attachment is not a valid PDF. Open the email in Gmail to check it.");
  return { bytes, filename: part.filename || "Attachment.pdf" };
}

export const gmailAttachmentRequest = z.object({
  id: z.string().uuid(), messageId: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/), partId: z.string().regex(/^[\d.]{1,200}$/),
});
export type GmailAttachmentRequest = z.infer<typeof gmailAttachmentRequest>;

export async function getGmailAttachment(userId: string, request: GmailAttachmentRequest, maxBytes = 35 * 1024 * 1024) {
  const input = gmailAttachmentRequest.parse(request);
  const { message, accessToken, connectedAt } = await ownedGmailMessage(userId, input.id, input.messageId);
  const part = flattenParts(message.payload).find(part => (part.partId || "0") === input.partId && (!!part.filename || !!part.body?.attachmentId));
  if (!part?.body) throw new GmailAttachmentError("Attachment not found.");
  if ((part.body.size || 0) > maxBytes) throw new GmailAttachmentError("This file is too large for this action. Open it in Gmail.");
  const body = part.body.attachmentId
    ? await gmailGet<{ data: string }>(accessToken, `messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(part.body.attachmentId)}`)
    : part.body;
  if (!body.data) throw new GmailAttachmentError("This attachment is empty.");
  const bytes = Buffer.from(body.data, "base64url");
  if (bytes.length > maxBytes) throw new GmailAttachmentError("This file is too large for this action. Open it in Gmail.");
  if (!await prisma.gmailConnection.count({ where: { userId, connectedAt } })) throw new GmailAttachmentError("Mailbox changed. Reload the inbox.");
  return { bytes, connectedAt, threadId: message.threadId, filename: (part.filename || "Attachment").replace(/[\r\n"\\/\x00-\x1f]/g, "_").slice(0, 180), mimeType: part.mimeType || "application/octet-stream" };
}
