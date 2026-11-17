import { GmailNotification, Prisma } from "@prisma/client";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { senderIdentity } from "./mime";

export async function createGmailSalesDraft(tx: Prisma.TransactionClient, userId: string, message: GmailNotification, kind: "QUOTATION" | "ORDER") {
  if (message.userId !== userId) throw new Error("Email not found.");
  const sender = senderIdentity(message.sender);
  const fy = getFinancialYearLabel(new Date());
  const context = [`Email: ${message.subject}`, `From: ${message.sender}`, `Received: ${message.receivedAt.toISOString()}`, "", message.bodyText || message.snippet || "Open the linked email to review the requirement."].join("\n").slice(0, 30_000);
  // Repeated clicks, including two browser tabs, reuse the same conversation draft.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${message.threadId + kind}))`;
  const existing = await tx.gmailThreadLink.findFirst({ where: { userId: userId, threadId: message.threadId, ...(kind === "QUOTATION" ? { quotation: { deletedAt: null, status: "DRAFT" } } : { salesOrder: { deletedAt: null, status: "DRAFT" } }) }, select: { quotationId: true, salesOrderId: true } });
  const existingId = kind === "QUOTATION" ? existing?.quotationId : existing?.salesOrderId;
  if (existingId) return { id: existingId, href: `/dashboard/sales/${kind === "QUOTATION" ? "quotations" : "orders"}/${existingId}/edit`, reused: true };
  const customer = sender.email ? await tx.customer.findFirst({ where: { deletedAt: null, companyEmail: { equals: sender.email, mode: "insensitive" } } }) : null;
  const common = {
    customerId: customer?.id || null, clientName: customer?.companyName || sender.name,
    receivedFromName: sender.name, receivedFromEmail: sender.email || null, receivedFromPhone: customer?.companyPhone || null,
    gst: customer?.defaultQuotationGst || "CGST_SGST_18" as const,
    packingCharges: customer?.defaultQuotationPackingCharges || "INCLUDED" as const,
    paymentTerms: customer?.defaultQuotationPaymentTerms || "ADVANCE" as const,
    transportationPayment: customer?.defaultQuotationTransportationPayment || "TO_PAY" as const,
    deliveryDate: customer?.defaultQuotationDeliveryDate || "4 weeks",
  };
  let recordId: string;
  if (kind === "QUOTATION") {
    const counter = await tx.fiscalCounter.upsert({ where: { key: `EXQN-${fy}` }, create: { key: `EXQN-${fy}`, value: 1 }, update: { value: { increment: 1 } } });
    const draft = await tx.quotation.create({ data: {
      ...common, quoteFy: fy, quoteNo: counter.value, status: "DRAFT", platform: "INFO", enquiryMessage: context,
      createdById: userId, updatedById: userId,
      draftData: { header: { ...common, platform: "INFO", enquiryMessage: context, nextFollowupAt: new Date(Date.now() + 7 * 86400000).toISOString() }, items: [] }, draftVersion: 0,
    }, select: { id: true } });
    recordId = draft.id;
  } else {
    const last = await tx.salesOrder.findFirst({ where: { orderFy: fy }, orderBy: { orderNo: "desc" }, select: { orderNo: true } });
    const orderHeader = { ...common, sourceType: "DIRECT", quotationId: null, poNumber: null, poDate: null, orderDate: new Date().toISOString(),
      clientNameSnapshot: common.clientName, citySnapshot: customer?.city || null, stateSnapshot: customer?.state || null, gstinSnapshot: customer?.gstin || null,
      additionalNotes: context, isConvertedFromQuotation: false, isClosed: false, isFullyDispatched: false, isFullyInvoiced: false, isOverdueForDispatch: false,
      subtotal: 0, discountTotal: 0, taxableTotal: 0, gstTotal: 0, grandTotal: 0, totalItemsCount: 0, totalOrderedQty: 0, totalDispatchedQty: 0, totalInvoicedQty: 0, totalPendingQty: 0 };
    const draft = await tx.salesOrder.create({ data: {
      ...common, orderFy: fy, orderNo: (last?.orderNo || 0) + 1, status: "DRAFT", sourceType: "DIRECT", additionalNotes: context,
      clientNameSnapshot: common.clientName, citySnapshot: customer?.city, stateSnapshot: customer?.state, gstinSnapshot: customer?.gstin,
      orderDate: new Date(), createdById: userId, updatedById: userId, draftData: { header: orderHeader, items: [] }, draftVersion: 0,
    }, select: { id: true } });
    recordId = draft.id;
  }
  await tx.gmailThreadLink.create({ data: { userId: userId, threadId: message.threadId, ...(kind === "QUOTATION" ? { quotationId: recordId } : { salesOrderId: recordId }) } });
  await tx.gmailNotification.updateMany({ where: { userId: userId, threadId: message.threadId, status: "NEW" }, data: { status: "IN_PROGRESS" } });
  return { id: recordId, href: `/dashboard/sales/${kind === "QUOTATION" ? "quotations" : "orders"}/${recordId}/edit`, reused: false };
}
