import type { Prisma } from "@prisma/client";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { mailSearchHints, matchWords, scoreSalesRecord, suggestExtractedProducts, type CatalogSuggestion } from "./suggestions";

type SuggestionDb = Pick<Prisma.TransactionClient, "salesOrder" | "quotation" | "product" | "gmailThreadLink">;

export async function findMailSalesSuggestions(db: SuggestionDb, userId: string, threadId: string, subject: string, sender: string, body: string, query = "") {
  const hints = mailSearchHints(query || subject, query ? "" : sender, query ? "" : body);
  const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });
  const names = query ? [...new Set([query, ...matchWords(query)])].slice(0, 25) : hints.nameWords;
  const identity = names.flatMap(word => [
    { clientName: contains(word) }, { receivedFromName: contains(word) }, { customer: { companyName: contains(word), deletedAt: null } },
  ]);
  const emailMatches = hints.email ? [{ receivedFromEmail: { equals: hints.email, mode: "insensitive" as const } }, { customer: { companyEmail: { equals: hints.email, mode: "insensitive" as const }, deletedAt: null } }] : [];
  const poTerms = [...new Set([...hints.poNumbers, ...(hints.text.match(/\b\d{4,}\b/g) ?? []), ...(query ? [query] : [])])].slice(0, 40);
  const orderIdentity: Prisma.SalesOrderWhereInput[] = [...identity, ...emailMatches, ...names.map(word => ({ clientNameSnapshot: contains(word) }))];
  const poMatches: Prisma.SalesOrderWhereInput[] = poTerms.map(word => ({ poNumber: contains(word) }));
  const orderSelect = { id: true, orderFy: true, orderNo: true, clientName: true, clientNameSnapshot: true, poNumber: true, receivedFromName: true, receivedFromEmail: true, customer: { select: { companyName: true, companyEmail: true } } } satisfies Prisma.SalesOrderSelect;
  const [poOrders, nameOrders, quotations, links] = await Promise.all([
    poMatches.length ? db.salesOrder.findMany({ where: { deletedAt: null, OR: poMatches }, select: orderSelect, orderBy: { updatedAt: "desc" }, take: 100 }) : [],
    orderIdentity.length ? db.salesOrder.findMany({ where: { deletedAt: null, OR: orderIdentity }, select: orderSelect, orderBy: { updatedAt: "desc" }, take: 100 }) : [],
    identity.length || emailMatches.length ? db.quotation.findMany({ where: { deletedAt: null, OR: [...identity, ...emailMatches] }, orderBy: { updatedAt: "desc" }, take: 100,
      select: { id: true, quoteFy: true, quoteNo: true, clientName: true, receivedFromName: true, receivedFromEmail: true, customer: { select: { companyName: true, companyEmail: true } } } }) : [],
    db.gmailThreadLink.findMany({ where: { userId, threadId }, select: { quotationId: true, salesOrderId: true } }),
  ]);
  const orders = [...new Map([...poOrders, ...nameOrders].map(order => [order.id, order])).values()];
  const suggestions = [
    ...orders.map(order => ({ kind: "ORDER" as const, id: order.id, label: `Order ${formatFinancialDocumentNumber(order.orderFy, order.orderNo)}`, customer: order.clientNameSnapshot || order.clientName || order.customer?.companyName || order.receivedFromName || "Customer", poNumber: order.poNumber, linked: links.some(link => link.salesOrderId === order.id), ...scoreSalesRecord(order, hints) })),
    ...quotations.map(quote => ({ kind: "QUOTATION" as const, id: quote.id, label: `Quotation ${formatFinancialDocumentNumber(quote.quoteFy, quote.quoteNo)}`, customer: quote.clientName || quote.customer?.companyName || quote.receivedFromName || "Customer", poNumber: null, linked: links.some(link => link.quotationId === quote.id), ...scoreSalesRecord(quote, hints) })),
  ].filter(item => query || item.score > 0).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, 15);
  return { suggestions, poNumbers: hints.poNumbers };
}

export async function findMailProductSuggestions(db: SuggestionDb, text: string) {
  const products = await db.product.findMany({ where: { deletedAt: null, status: "ACTIVE" }, select: {
    id: true, name: true, displayName: true, variants: { where: { status: "ACTIVE" }, select: { id: true, variant: true, displayName: true, sku: true, typeNumber: true, rating: true } },
  } });
  const catalog = products.flatMap<CatalogSuggestion>(product => product.variants.length
    ? product.variants.map(variant => ({ productId: product.id, productName: product.displayName || product.name, productAliases: [product.name], variantId: variant.id, variantName: variant.displayName || variant.variant, variantAliases: [variant.variant], sku: variant.sku, typeNumber: variant.typeNumber, rating: variant.rating }))
    : [{ productId: product.id, productName: product.displayName || product.name, productAliases: [product.name], variantId: null, variantName: null, sku: null, typeNumber: null, rating: null }]);
  return suggestExtractedProducts(text, catalog);
}
