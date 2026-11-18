import nodemailer from "nodemailer";
import { z } from "zod";
import { GmailApiError } from "./google";
import type { QuotationReply } from "./quotationReply";
import { quotationMessageHtml } from "../quotations/emailMessage";

export const quotationEmailSchema = z.object({
  quotationId: z.string().uuid(),
  requestId: z.string().uuid(),
  expectedUpdatedAt: z.iso.datetime(),
  recipient: z.email().max(254),
  subject: z.string().trim().min(1).max(998).refine((value) => !/[\r\n\x00-\x1f]/.test(value)),
  message: z.string().trim().min(1).max(10_000),
  replyNotificationId: z.string().uuid().nullable().optional(),
  followupAt: z.iso.datetime().nullable().optional().refine((value) => !value || new Date(value).getTime() > Date.now(), "Choose a future follow-up date."),
});

export class GmailSendUncertainError extends Error {
  constructor() {
    super("Gmail did not confirm the send result. Check your Gmail Sent folder before sending this quotation again.");
  }
}

type PdfEmail = { sender: string; recipient: string; subject: string; message: string; filename: string; pdf: Buffer; reply?: QuotationReply };

export async function buildQuotationMime(input: PdfEmail) {
  z.email().parse(input.sender);
  z.email().parse(input.recipient);
  if (/[\r\n\x00-\x1f]/.test(input.subject) || !input.subject.trim()) throw new Error("Invalid email subject.");
  if (input.pdf.length > 18 * 1024 * 1024) throw new Error("The quotation PDF is too large to email. Please reduce the selected images.");
  if (!input.pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Invalid quotation PDF.");
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" });
  const result = await transport.sendMail({
    from: input.sender, to: input.recipient, subject: input.subject,
    text: input.message,
    html: quotationMessageHtml(input.message),
    ...(input.reply ? { inReplyTo: input.reply.inReplyTo, references: input.reply.references } : {}),
    attachments: [{ filename: input.filename, content: input.pdf, contentType: "application/pdf" }],
    disableFileAccess: true, disableUrlAccess: true,
  });
  return (result.message as Buffer).toString("base64url");
}

/** Never retry a send automatically: a lost response can still mean Google accepted the mail. */
export async function sendQuotationWithGmailReceipt(accessToken: string, raw: string, threadId?: string) {
  let response: Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw, ...(threadId ? { threadId } : {}) }),
    });
  } catch { throw new GmailSendUncertainError(); }
  if (response.status >= 500) throw new GmailSendUncertainError();
  if (!response.ok) throw new GmailApiError(response.status, "send_error");
  try {
    const data: unknown = await response.json();
    return z.object({ id: z.string().min(1), threadId: z.string().min(1).optional() }).parse(data);
  } catch { throw new GmailSendUncertainError(); }
}

export async function sendQuotationWithGmail(accessToken: string, raw: string, threadId?: string) {
  return (await sendQuotationWithGmailReceipt(accessToken, raw, threadId)).id;
}
