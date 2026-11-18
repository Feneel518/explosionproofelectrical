"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "@/lib/gmail/crypto";
import { exchangeGmailToken, gmailCanSend, GmailApiError } from "@/lib/gmail/google";
import { getQuotationReply, type QuotationReply } from "@/lib/gmail/quotationReply";
import { getQuotationReplyOptionsAction } from "./getQuotationReplyOptionsAction";
import { buildQuotationMime, quotationEmailSchema, sendQuotationWithGmailReceipt } from "@/lib/gmail/send";
import { linkSalesConversation } from "@/lib/gmail/salesConversation";
import { deliverQuotation, QuotationPreparationError, type DeliveryResult } from "@/lib/quotations/delivery";
import { quotationPdfFilename, renderQuotationPdf } from "@/lib/quotations/pdf";
import { quotationPdfSession } from "@/lib/quotations/pdfSession";
import { getQuotationByIdAction } from "./getQuotationByIdAction";
import { recordQuotationDelivery } from "@/lib/quotations/recordDelivery";
import { revalidatePath } from "next/cache";

export async function sendQuotationEmailAction(input: unknown): Promise<DeliveryResult> {
  const { user } = await requirePermission("sales.write");
  const parsed = quotationEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues.some((issue) => issue.path[0] === "followupAt") ? "Choose a future follow-up date." : "Enter a valid recipient, subject and message, then try again." };
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
    let sentThreadId = reply?.threadId;
    let followupScheduled = false;
    const deliveryResult = await deliverQuotation({
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
      send: async ({ raw, accessToken }) => {
        const receipt = await sendQuotationWithGmailReceipt(accessToken, raw, reply?.threadId);
        sentThreadId = receipt.threadId || reply?.threadId;
        return receipt.id;
      },
      record: async (status, messageId) => {
        await prisma.$transaction(async (tx) => {
          const recorded = await recordQuotationDelivery(tx, { requestId: data.requestId, quotationId: quotation.id, userId: user.id,
            expectedUpdatedAt: quotation.updatedAt, status, messageId, followupAt: data.followupAt ? new Date(data.followupAt) : null });
          if (status === "SENT" && sentThreadId) await linkSalesConversation(tx, user.id, sentThreadId, "QUOTATION", quotation.id);
          if (status === "SENT" && sentThreadId) await tx.gmailNotification.updateMany({ where: { userId: user.id, threadId: sentThreadId, status: "NEW" }, data: { status: "IN_PROGRESS" } });
          return recorded;
        }).then((recorded) => { followupScheduled = recorded.followupScheduled; });
      },
    });
    if (deliveryResult.ok) {
      revalidatePath("/dashboard/sales/quotations");
      revalidatePath(`/dashboard/sales/quotations/${quotation.id}`);
      revalidatePath("/dashboard/sales/quotations/analytics");
      revalidatePath("/dashboard/inbox");
    }
    return deliveryResult.ok && followupScheduled ? { ...deliveryResult, message: "Quotation sent with the PDF attached. Your follow-up reminder is scheduled." } : deliveryResult;
  } catch {
    return { ok: false, uncertain: true, message: "The email result could not be checked. Check Gmail Sent before starting another send." };
  }
}
