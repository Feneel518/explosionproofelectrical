"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "@/lib/gmail/crypto";
import { exchangeGmailToken, gmailCanSend, GmailApiError } from "@/lib/gmail/google";
import { getQuotationReply, type QuotationReply } from "@/lib/gmail/quotationReply";
import { getQuotationReplyOptionsAction } from "./getQuotationReplyOptionsAction";
import { buildQuotationMime, quotationEmailSchema, sendQuotationWithGmail } from "@/lib/gmail/send";
import { deliverQuotation, QuotationPreparationError, type DeliveryResult } from "@/lib/quotations/delivery";
import { quotationPdfFilename, renderQuotationPdf } from "@/lib/quotations/pdf";
import { quotationPdfSession } from "@/lib/quotations/pdfSession";
import { getQuotationByIdAction } from "./getQuotationByIdAction";

export async function sendQuotationEmailAction(input: unknown): Promise<DeliveryResult> {
  const { user } = await requireAuth();
  const parsed = quotationEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid recipient, subject and message, then try again." };
  const data = parsed.data;
  try {
    const [result, connection] = await Promise.all([
      getQuotationByIdAction(data.quotationId),
      prisma.gmailConnection.findUnique({ where: { userId: user.id } }),
    ]);
    if (!result.ok || result.quotation.deletedAt) return { ok: false, message: "Quotation not found." };
    const quotation = result.quotation;
    if (["DRAFT", "CANCELLED"].includes(quotation.status)) return { ok: false, message: "Finalize an active quotation before sending it." };
    if (quotation.updatedAt.toISOString() !== data.expectedUpdatedAt) return { ok: false, message: "This quotation has changed. Refresh the page and review its PDF before sending." };
    if (!connection || !gmailCanSend(connection.grantedScopes)) return { ok: false, message: "Connect or reconnect Gmail from Inbox Alerts and allow sending before emailing a quotation." };
    let reply: QuotationReply | undefined;
    if (data.replyNotificationId) {
      try {
        const options = await getQuotationReplyOptionsAction(quotation.id);
        if (!options.some((option) => option.id === data.replyNotificationId)) return { ok: false, message: "Select a conversation belonging to this customer or linked quotation." };
        const notification = await prisma.gmailNotification.findFirst({ where: { id: data.replyNotificationId, userId: user.id }, select: { messageId: true, threadId: true } });
        if (!notification) return { ok: false, message: "The original conversation is no longer available." };
        const tokens = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(connection.encryptedRefreshToken) });
        reply = await getQuotationReply(tokens.access_token, notification.messageId, notification.threadId);
        if (reply.recipient.toLowerCase() !== data.recipient.toLowerCase() || reply.subject !== data.subject) return { ok: false, message: "The original email's reply address or subject changed. Select the conversation again before sending." };
      } catch (error) {
        return { ok: false, message: error instanceof GmailApiError ? error.message : "Could not prepare the original conversation. Select it again or send a new email." };
      }
    }
    return await deliverQuotation({
      claim: async () => {
        const created = await prisma.quotationEmailDelivery.createMany({ data: [{
          id: data.requestId, quotationId: quotation.id, userId: user.id,
          sender: connection.email, recipient: data.recipient, subject: data.subject,
        }], skipDuplicates: true });
        if (created.count) return "NEW";
        const previous = await prisma.quotationEmailDelivery.findUnique({ where: { id: data.requestId } });
        if (!previous || previous.userId !== user.id || previous.quotationId !== quotation.id
          || previous.recipient !== data.recipient || previous.subject !== data.subject) throw new Error("Invalid send request.");
        if (previous.status === "SENT" || previous.status === "FAILED" || previous.status === "UNKNOWN") return previous.status;
        return "PENDING";
      },
      prepare: async () => {
        const [pdf, tokens] = await Promise.all([
          quotationPdfSession().then((session) => renderQuotationPdf(quotation, session)),
          exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(connection.encryptedRefreshToken) }),
        ]);
        if (tokens.scope && !gmailCanSend(tokens.scope)) throw new QuotationPreparationError("Reconnect Gmail and allow sending quotations.");
        const raw = await buildQuotationMime({ sender: connection.email, recipient: data.recipient, subject: data.subject,
          message: data.message, filename: quotationPdfFilename(quotation), pdf, reply });
        // A disconnect, mailbox switch, edit or deletion during PDF generation invalidates this request.
        const [currentConnection, currentQuotation] = await Promise.all([
          prisma.gmailConnection.findUnique({ where: { userId: user.id }, select: { connectedAt: true, grantedScopes: true } }),
          prisma.quotation.findUnique({ where: { id: quotation.id }, select: { updatedAt: true, deletedAt: true, status: true } }),
        ]);
        if (!currentConnection || currentConnection.connectedAt.getTime() !== connection.connectedAt.getTime()
          || !gmailCanSend(currentConnection.grantedScopes)) throw new QuotationPreparationError("Your Gmail connection changed. Refresh the page before sending.");
        if (!currentQuotation || currentQuotation.deletedAt || ["DRAFT", "CANCELLED"].includes(currentQuotation.status)
          || currentQuotation.updatedAt.toISOString() !== data.expectedUpdatedAt) throw new QuotationPreparationError("This quotation has changed. Refresh and review the PDF before sending.");
        return { raw, accessToken: tokens.access_token };
      },
      send: ({ raw, accessToken }) => sendQuotationWithGmail(accessToken, raw, reply?.threadId),
      record: async (status, messageId) => {
        await prisma.quotationEmailDelivery.update({ where: { id: data.requestId }, data: {
          status, gmailMessageId: messageId, sentAt: status === "SENT" ? new Date() : null,
        } });
      },
    });
  } catch {
    return { ok: false, uncertain: true, message: "The email result could not be checked. Check Gmail Sent before starting another send." };
  }
}
