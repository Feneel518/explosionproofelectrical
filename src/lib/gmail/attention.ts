import type { Prisma } from "@prisma/client";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

export type AttentionCategory = "MESSAGES" | "READY" | "FOLLOWUPS" | "ORDERS";
export type AttentionItem = { key: string; category: AttentionCategory; title: string; customer: string; detail: string; date: string; href: string; action: string; notificationId?: string };

export async function getSalesAttention(db: Pick<Prisma.TransactionClient, "gmailNotification" | "quotation" | "salesOrder">, userId: string, now = new Date()) {
  const messages: Prisma.GmailNotificationWhereInput = { userId, status: "NEW" };
  const ownedQuote: Prisma.QuotationWhereInput = { deletedAt: null, OR: [{ createdById: userId }, { gmailThreadLinks: { some: { userId } } }] };
  const ready: Prisma.QuotationWhereInput = { ...ownedQuote, status: "READY", convertedToOrderAt: null };
  const followups: Prisma.QuotationWhereInput = { ...ownedQuote, status: { in: ["SENT", "FOLLOWUP"] }, convertedToOrderAt: null, nextFollowupAt: { lte: now } };
  const orders: Prisma.SalesOrderWhereInput = { deletedAt: null, status: "DRAFT", OR: [{ createdById: userId }, { gmailThreadLinks: { some: { userId } } }] };
  const [messageRows, readyRows, followupRows, orderRows, messageCount, readyCount, followupCount, orderCount] = await Promise.all([
    db.gmailNotification.findMany({ where: messages, orderBy: { receivedAt: "desc" }, take: 10, select: { id: true, subject: true, sender: true, receivedAt: true } }),
    db.quotation.findMany({ where: ready, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, quoteFy: true, quoteNo: true, clientName: true, receivedFromName: true, updatedAt: true } }),
    db.quotation.findMany({ where: followups, orderBy: { nextFollowupAt: "asc" }, take: 10, select: { id: true, quoteFy: true, quoteNo: true, clientName: true, receivedFromName: true, nextFollowupAt: true } }),
    db.salesOrder.findMany({ where: orders, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, orderFy: true, orderNo: true, clientName: true, poNumber: true, updatedAt: true } }),
    db.gmailNotification.count({ where: messages }), db.quotation.count({ where: ready }), db.quotation.count({ where: followups }), db.salesOrder.count({ where: orders }),
  ]);
  const items: AttentionItem[] = [
    ...followupRows.map((row): AttentionItem => ({ key: `followup:${row.id}`, category: "FOLLOWUPS", title: `Quotation ${formatFinancialDocumentNumber(row.quoteFy, row.quoteNo)}`, customer: row.clientName || row.receivedFromName || "Customer", detail: "Follow-up is due", date: row.nextFollowupAt!.toISOString(), href: `/dashboard/sales/quotations/${row.id}#quotation-followups`, action: "Manage follow-up" })),
    ...messageRows.map((row): AttentionItem => ({ key: `message:${row.id}`, category: "MESSAGES", title: row.subject, customer: row.sender, detail: "New customer message to review", date: row.receivedAt.toISOString(), href: `/dashboard/inbox?message=${row.id}`, action: "Review message", notificationId: row.id })),
    ...readyRows.map((row): AttentionItem => ({ key: `ready:${row.id}`, category: "READY", title: `Quotation ${formatFinancialDocumentNumber(row.quoteFy, row.quoteNo)}`, customer: row.clientName || row.receivedFromName || "Customer", detail: "Customer copy is ready to send", date: row.updatedAt.toISOString(), href: `/dashboard/sales/quotations/${row.id}`, action: "Open quotation" })),
    ...orderRows.map((row): AttentionItem => ({ key: `order:${row.id}`, category: "ORDERS", title: `Order ${formatFinancialDocumentNumber(row.orderFy, row.orderNo)}`, customer: row.clientName || "Customer", detail: row.poNumber ? `PO ${row.poNumber} - review before confirming` : "Draft needs your review before confirming", date: row.updatedAt.toISOString(), href: `/dashboard/sales/orders/${row.id}/edit`, action: "Review order" })),
  ];
  return { items, counts: { MESSAGES: messageCount, READY: readyCount, FOLLOWUPS: followupCount, ORDERS: orderCount }, total: messageCount + readyCount + followupCount + orderCount };
}
