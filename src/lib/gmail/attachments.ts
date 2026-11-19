import { gmailGet } from "./google";
import { flattenParts, type GmailMessage, type GmailPart } from "./mime";

export const MAX_GMAIL_PDF_BYTES = 25 * 1024 * 1024;
export type GmailPdfAttachment = { partId: string; filename: string; size: number };

export class GmailAttachmentError extends Error {
  constructor(public status: number, message: string) { super(message); }
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
