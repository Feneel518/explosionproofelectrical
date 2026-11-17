"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { createGmailSalesDraft } from "@/lib/gmail/salesDraft";
import { senderIdentity } from "@/lib/gmail/mime";
import { z } from "zod";
import { linkSalesConversation } from "@/lib/gmail/salesConversation";
import { createDraftSalesOrderAction } from "@/lib/actions/dashboard/sales/order/createDraftSalesOrderAction";

const recordType = z.enum(["QUOTATION", "ORDER"]);
type RecordType = z.infer<typeof recordType>;

async function ownedNotification(userId: string, id: string) {
  const message = await prisma.gmailNotification.findFirst({ where: { id: z.string().uuid().parse(id), userId } });
  if (!message) throw new Error("Email not found.");
  return message;
}

export async function getGmailSalesLinksAction(id: string) {
  const { user } = await requireAuth();
  const message = await ownedNotification(user.id, id);
  const links = await prisma.gmailThreadLink.findMany({ where: { userId: user.id, threadId: message.threadId }, include: {
    quotation: { select: { id: true, quoteFy: true, quoteNo: true, clientName: true, status: true, deletedAt: true, nextFollowupAt: true, convertedToOrderAt: true } },
    salesOrder: { select: { id: true, orderFy: true, orderNo: true, clientName: true, status: true, deletedAt: true, poNumber: true, totalPendingQty: true, totalDispatchedQty: true } },
  }, orderBy: { createdAt: "asc" } });
  const sender = senderIdentity(message.sender);
  const customer = sender.email ? await prisma.customer.findFirst({ where: { deletedAt: null, companyEmail: { equals: sender.email, mode: "insensitive" } }, select: { id: true, companyName: true, city: true } }) : null;
  return { customer, links: links.flatMap(link => {
    if (link.quotation && !link.quotation.deletedAt) return [{ id: link.id, recordId: link.quotation.id, nextFollowupAt: link.quotation.nextFollowupAt?.toISOString() || null, canCreateOrder: !link.quotation.convertedToOrderAt && ["SENT", "FOLLOWUP"].includes(link.quotation.status), tracking: "", kind: "QUOTATION" as RecordType, title: `Quotation ${link.quotation.quoteFy}/${link.quotation.quoteNo}`, subtitle: link.quotation.clientName || "Draft quotation", status: link.quotation.status as string, href: `/dashboard/sales/quotations/${link.quotation.id}${link.quotation.status === "DRAFT" ? "/edit" : ""}` }];
    if (link.salesOrder && !link.salesOrder.deletedAt) return [{ id: link.id, recordId: link.salesOrder.id, nextFollowupAt: null, canCreateOrder: false, tracking: `${link.salesOrder.poNumber ? `PO ${link.salesOrder.poNumber} · ` : ""}${link.salesOrder.totalDispatchedQty} dispatched · ${link.salesOrder.totalPendingQty} pending`, kind: "ORDER" as RecordType, title: `Order ${link.salesOrder.orderFy}/${link.salesOrder.orderNo}`, subtitle: link.salesOrder.clientName || "Draft sales order", status: link.salesOrder.status as string, href: `/dashboard/sales/orders/${link.salesOrder.id}${link.salesOrder.status === "DRAFT" ? "/edit" : ""}` }];
    return [];
  }) };
}
export type GmailSalesLinks = Awaited<ReturnType<typeof getGmailSalesLinksAction>>;

export async function searchGmailSalesRecordsAction(kind: RecordType, search: string) {
  await requireAuth();
  recordType.parse(kind);
  const term = z.string().trim().max(150).parse(search);
  const number = /^\d+$/.test(term) ? Number(term) : undefined;
  const numberFilter = number !== undefined && Number.isSafeInteger(number) && number < 2_147_483_647 ? number : undefined;
  if (kind === "QUOTATION") {
    const records = await prisma.quotation.findMany({ where: { deletedAt: null, ...(term ? { OR: [
      { clientName: { contains: term, mode: "insensitive" as const } }, { receivedFromEmail: { contains: term, mode: "insensitive" as const } },
      { receivedFromName: { contains: term, mode: "insensitive" as const } }, ...(numberFilter !== undefined ? [{ quoteNo: numberFilter }] : []),
    ] } : {}) }, select: { id: true, quoteNo: true, quoteFy: true, clientName: true, receivedFromName: true, status: true }, orderBy: { createdAt: "desc" }, take: 15 });
    return records.map(record => ({ id: record.id, title: `Quotation ${record.quoteFy}/${record.quoteNo}`, subtitle: record.clientName || record.receivedFromName || "Unassigned customer", status: record.status as string }));
  }
  const records = await prisma.salesOrder.findMany({ where: { deletedAt: null, ...(term ? { OR: [
    { clientName: { contains: term, mode: "insensitive" as const } }, { receivedFromEmail: { contains: term, mode: "insensitive" as const } },
    { poNumber: { contains: term, mode: "insensitive" as const } }, ...(numberFilter !== undefined ? [{ orderNo: numberFilter }] : []),
  ] } : {}) }, select: { id: true, orderNo: true, orderFy: true, clientName: true, clientNameSnapshot: true, status: true }, orderBy: { createdAt: "desc" }, take: 15 });
  return records.map(record => ({ id: record.id, title: `Order ${record.orderFy}/${record.orderNo}`, subtitle: record.clientName || record.clientNameSnapshot || "Unassigned customer", status: record.status as string }));
}

export async function linkGmailSalesRecordAction(id: string, kind: RecordType, recordId: string) {
  const { user } = await requireAuth();
  const message = await ownedNotification(user.id, id);
  recordType.parse(kind); z.string().uuid().parse(recordId);
  const record = kind === "QUOTATION" ? await prisma.quotation.findFirst({ where: { id: recordId, deletedAt: null }, select: { id: true } }) : await prisma.salesOrder.findFirst({ where: { id: recordId, deletedAt: null }, select: { id: true } });
  if (!record) throw new Error("Sales record not found.");
  await prisma.$transaction((tx) => linkSalesConversation(tx, user.id, message.threadId, kind, recordId));
}

export async function unlinkGmailSalesRecordAction(linkId: string) {
  const { user } = await requireAuth();
  await prisma.gmailThreadLink.deleteMany({ where: { id: z.string().uuid().parse(linkId), userId: user.id } });
}

export async function createSalesDraftFromGmailAction(id: string, kind: RecordType) {
  const { user } = await requireAuth();
  const message = await ownedNotification(user.id, id);
  recordType.parse(kind);
  if (kind === "ORDER") {
    const quotations = await prisma.gmailThreadLink.findMany({ where: { userId: user.id, threadId: message.threadId, quotation: { deletedAt: null, convertedToOrderAt: null, status: { in: ["SENT", "FOLLOWUP"] } } }, select: { quotationId: true } });
    if (quotations.length === 1 && quotations[0].quotationId) {
      const result = await createDraftSalesOrderAction(quotations[0].quotationId);
      if (!result.ok) throw new Error(result.message);
      return { id: result.id, href: `/dashboard/sales/orders/${result.id}/edit`, reused: false };
    }
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        return createGmailSalesDraft(tx, user.id, message, kind);
      }, { timeout: 20_000 });
    } catch (error) {
      if (attempt < 2 && error && typeof error === "object" && "code" in error && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Could not create a draft. Try again.");
}
