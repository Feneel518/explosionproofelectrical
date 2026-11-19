import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { createGmailSalesDraft } from "./salesDraft";
import { reviewedOrderPdfSchema, type ReviewedOrderPdf } from "./orderPdfSchema";

type Match = { id: string; productId: string; sku: string | null; typeNumber: string | null; variant: string; product: { name: string; hsnCode: string | null } };

export function matchPdfItem(item: ReviewedOrderPdf["items"][number], candidates: Match[]) {
  const normalize = (value: string | null) => value?.trim().toLowerCase();
  const matches = candidates.filter(candidate => item.sku
    ? normalize(candidate.sku) === normalize(item.sku) && (!item.typeNumber || normalize(candidate.typeNumber) === normalize(item.typeNumber))
    : !!item.typeNumber && normalize(candidate.typeNumber) === normalize(item.typeNumber));
  return matches.length === 1 ? matches[0] : null;
}

export async function applyGmailPdfOrderDraft(tx: Prisma.TransactionClient, userId: string, importId: string, input: ReviewedOrderPdf) {
  const review = reviewedOrderPdfSchema.parse(input);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${importId}))`;
  const imported = await tx.gmailPdfImport.findFirst({ where: { id: importId, userId, status: "READY" }, include: { notification: true, order: { select: { id: true, deletedAt: true, status: true } } } });
  if (!imported) throw new Error("PDF reading not found. Extract the PDF again.");
  if (imported.order && !imported.order.deletedAt) return { id: imported.order.id, href: `/dashboard/sales/orders/${imported.order.id}${imported.order.status === "DRAFT" ? "/edit" : ""}`, reused: true };
  const skus = review.items.flatMap(item => item.sku ? [item.sku] : []);
  const types = review.items.flatMap(item => item.typeNumber ? [item.typeNumber] : []);
  const candidates = skus.length || types.length ? await tx.productVariant.findMany({ where: {
    status: "ACTIVE", product: { deletedAt: null, status: "ACTIVE" },
    OR: [...skus.map(sku => ({ sku: { equals: sku, mode: "insensitive" as const } })), ...types.map(typeNumber => ({ typeNumber: { equals: typeNumber, mode: "insensitive" as const } }))],
  }, select: { id: true, productId: true, sku: true, typeNumber: true, variant: true, product: { select: { name: true, hsnCode: true } } } }) : [];
  let created = await createGmailSalesDraft(tx, userId, imported.notification, "ORDER");
  let order = await tx.salesOrder.findUniqueOrThrow({ where: { id: created.id }, select: { id: true, draftData: true, draftVersion: true, status: true, customerId: true, clientName: true } });
  const existingDraft = order.draftData as { header?: Record<string, unknown>; items?: unknown[] } | null;
  if (existingDraft?.items?.length) {
    // Preserve work already entered in another draft for this conversation.
    created = await createGmailSalesDraft(tx, userId, imported.notification, "ORDER", { createNew: true });
    order = await tx.salesOrder.findUniqueOrThrow({ where: { id: created.id }, select: { id: true, draftData: true, draftVersion: true, status: true, customerId: true, clientName: true } });
  }
  if (order.status !== "DRAFT") throw new Error("Only an editable draft can receive PDF items.");
  const draft = order.draftData as { header?: Record<string, unknown> };
  const items = review.items.map((item, sortOrder) => {
    const match = matchPdfItem(item, candidates);
    return { id: randomUUID(), productId: match?.productId || null, variantId: match?.id || null, title: item.title,
      description: item.description, sku: item.sku, typeNumber: item.typeNumber, hsnCode: item.hsnCode || match?.product.hsnCode || null,
      qty: item.quantity, unit: item.unit, unitPrice: item.unitPrice, poReference: review.poNumber,
      selectedVariantImageIds: [], selectedVariantDrawingIds: [], variantImagesSnapshot: [], variantDrawingsSnapshot: [],
      showVariantImages: false, showVariantDrawings: false, dispatchedQty: 0, invoicedQty: 0, pendingQty: item.quantity,
      lineSubtotal: Math.round(item.quantity * item.unitPrice * 100) / 100, lineGstTotal: 0, lineGrandTotal: 0,
      component: [], sortOrder };
  });
  const clientName = order.customerId ? order.clientName : review.buyerName || order.clientName;
  const header = { ...draft.header, clientName, clientNameSnapshot: clientName, poNumber: review.poNumber, poDate: review.poDate ? `${review.poDate}T00:00:00.000Z` : null,
    additionalNotes: `${draft.header?.additionalNotes || ""}\n\nItems reviewed from ${imported.filename}. Prices in INR. Verify commercial terms and taxes before finalizing.`,
  };
  const updated = await tx.salesOrder.updateMany({ where: { id: order.id, status: "DRAFT", draftVersion: order.draftVersion }, data: {
    poNumber: review.poNumber, poDate: review.poDate ? new Date(`${review.poDate}T00:00:00Z`) : null,
    clientName, clientNameSnapshot: clientName, draftData: { header, items } as Prisma.InputJsonValue,
    draftVersion: { increment: 1 }, updatedById: userId,
  } });
  if (!updated.count) throw new Error("This draft changed in another tab. Reload before importing.");
  await tx.gmailPdfImport.update({ where: { id: imported.id }, data: { orderId: order.id } });
  return { id: order.id, href: `/dashboard/sales/orders/${order.id}/edit`, reused: false };
}
