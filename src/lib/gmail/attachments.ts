import { z } from "zod";
import { prisma } from "@/lib/prisma/db";
import { ownedGmailMessage } from "./access";
import { gmailGet } from "./google";
import { flattenParts } from "./mime";

export const gmailAttachmentRequest = z.object({
  id: z.string().uuid(), messageId: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/), partId: z.string().regex(/^[\d.]{1,200}$/),
});
export type GmailAttachmentRequest = z.infer<typeof gmailAttachmentRequest>;
export class GmailAttachmentError extends Error {}

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
