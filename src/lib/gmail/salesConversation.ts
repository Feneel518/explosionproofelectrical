import type { Prisma } from "@prisma/client";

/** Links stay private to the mailbox owner and follow the quotation/order relationship. */
export async function linkSalesConversation(tx: Prisma.TransactionClient, userId: string, threadId: string, kind: "QUOTATION" | "ORDER", recordId: string) {
  const documents: { quotationId?: string; salesOrderId?: string }[] = [];
  if (kind === "QUOTATION") {
    const quotation = await tx.quotation.findFirst({ where: { id: recordId, deletedAt: null }, select: { id: true, salesOrders: { where: { deletedAt: null }, select: { id: true } } } });
    if (!quotation) throw new Error("Quotation not found.");
    documents.push({ quotationId: quotation.id }, ...quotation.salesOrders.map((order) => ({ salesOrderId: order.id })));
  } else {
    const order = await tx.salesOrder.findFirst({ where: { id: recordId, deletedAt: null }, select: { id: true, quotation: { select: { id: true, deletedAt: true } } } });
    if (!order) throw new Error("Sales order not found.");
    documents.push({ salesOrderId: order.id });
    if (order.quotation && !order.quotation.deletedAt) documents.push({ quotationId: order.quotation.id });
  }
  await tx.gmailThreadLink.createMany({ data: documents.map((document) => ({ userId, threadId, ...document })), skipDuplicates: true });
}

export async function inheritQuotationConversations(tx: Prisma.TransactionClient, userId: string, quotationId: string, orderId: string) {
  const links = await tx.gmailThreadLink.findMany({ where: { userId, quotationId }, select: { threadId: true } });
  for (const link of links) await linkSalesConversation(tx, userId, link.threadId, "ORDER", orderId);
}
