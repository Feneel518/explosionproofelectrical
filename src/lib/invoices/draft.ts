import { z } from "zod";
import type { GST } from "@prisma/client";
import type { InvoiceDraftData } from "@/lib/types/Invoicetable";
import { calculateInvoiceAmounts } from "./amounts";

const text = z.string().max(5000).nullish();
const id = z.string().max(120).nullish();
const quantity = z.number().finite().min(0).max(1_000_000).refine(n => Math.abs(n * 1000 - Math.round(n * 1000)) < 0.000001, "Quantity supports up to three decimal places.");
const media = z.object({ kind: z.enum(["IMAGE", "DRAWING"]), url: z.url().max(2000), title: text }).passthrough();
const date = z.string().max(40).refine(value => !Number.isNaN(Date.parse(value)), "Enter a valid date.").nullish();
const schema = z.object({
  header: z.object({
    discountType: z.enum(["PERCENTAGE", "AMOUNT"]).default("AMOUNT"),
    discountValue: z.number().finite().min(0).max(1e10).default(0),
    invoiceNo: z.number().int().positive().optional(), salesOrderId: id, customerId: id,
    invoiceDate: date, dueDate: date, dispatchDate: date, poDate: date,
    poNumber: text, clientNameSnapshot: text, citySnapshot: text, stateSnapshot: text, gstinSnapshot: text,
    transportationPayment: z.enum(["PAID", "TO_PAY"]).nullish(), transportationAmount: z.number().finite().min(0).max(1e10).nullish(),
    lrCopy: z.array(media).max(25).optional(),
    gstMode: z.enum(["IGST_18", "CGST_SGST_18", "IGST_0_SEZ", "CGST_SGST_0_SEZ", "IGST_5", "CGST_SGST_5", "IGST_12", "CGST_SGST_12", "IGST_28", "CGST_SGST_28", "IGST_0_1", "CGST_SGST_0_1"]).optional(),
  }).passthrough(),
  items: z.array(z.object({
    id, salesOrderItemId: id, isManual: z.boolean().optional(), productId: id, variantId: id,
    sku: text, typeNumber: text, description: text, hsnCode: text, unit: text, cimfrNumber: text, pesoNumber: text, serialNumber: text,
    orderedQty: quantity.default(0), alreadyInvoiced: quantity.default(0), alreadyDispatched: quantity.default(0), remainingQty: quantity.default(0),
    title: z.string().max(1000), qty: quantity, unitPrice: z.number().finite().min(0).max(1e10),
    selected: z.boolean().optional(), selectedSerialIds: z.array(z.uuid()).max(1000).optional(),
    productPicture: z.array(media).max(25).optional(),
  }).passthrough()).max(500),
  packages: z.array(z.object({
    packageNo: z.string().max(100), packageType: text, label: text, remarks: text,
    grossWeight: z.number().finite().min(0).nullish(), netWeight: z.number().finite().min(0).nullish(),
    items: z.array(z.object({ salesOrderItemId: id, invoiceItemDraftId: id, qty: quantity }).passthrough()).max(500),
  }).passthrough()).max(500).default([]),
});
export function normalizeInvoiceDraft(input: unknown, gstMode?: GST, final = false): InvoiceDraftData {
  if (JSON.stringify(input).length > 1_000_000) throw new Error("Invoice draft is too large.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid invoice draft.");
  const data = parsed.data;
  if (final && (!data.items.length || data.items.some(item => !item.title.trim() || item.qty <= 0 || !Number.isInteger(item.qty)))) throw new Error("Each invoice item needs a title and a whole quantity greater than zero.");
  if (final) {
    const linkedIds = data.items.filter(item => !item.isManual && item.salesOrderItemId).map(item => item.salesOrderItemId);
    if (new Set(linkedIds).size !== linkedIds.length) throw new Error("Each sales order item may appear only once in an invoice.");
  }
  const totals = calculateInvoiceAmounts(data.items, gstMode ?? data.header.gstMode ?? "CGST_SGST_18", { type: data.header.discountType, value: data.header.discountValue });
  const draft = {
    header: { ...data.header, salesOrderId: data.header.salesOrderId || null, customerId: data.header.customerId || null,
      invoiceDate: data.header.invoiceDate || null, dueDate: data.header.dueDate || null, poNumber: data.header.poNumber || "", poDate: data.header.poDate || null,
      clientNameSnapshot: data.header.clientNameSnapshot || "", citySnapshot: data.header.citySnapshot || "", stateSnapshot: data.header.stateSnapshot || "", gstinSnapshot: data.header.gstinSnapshot || "",
      gstMode: gstMode ?? data.header.gstMode ?? "CGST_SGST_18", subtotal: totals.subtotal, discountTotal: totals.discountTotal, taxableTotal: totals.taxableTotal, gstTotal: totals.gstTotal, grandTotal: totals.grandTotal },
    items: totals.items.map((item, index) => ({ ...item, id: item.id || item.salesOrderItemId || crypto.randomUUID(), salesOrderItemId: item.salesOrderItemId || item.id || "", productId: item.productId || null, variantId: item.variantId || null, sku: item.sku || null, typeNumber: item.typeNumber || null, description: item.description || null, hsnCode: item.hsnCode || null, unit: item.unit || null, sortOrder: index })),
    packages: data.packages.map(pkg => ({ ...pkg, packageType: pkg.packageType || null, label: pkg.label || null, remarks: pkg.remarks || null, grossWeight: pkg.grossWeight ?? null, netWeight: pkg.netWeight ?? null, items: pkg.items.map(item => ({ ...item, salesOrderItemId: item.salesOrderItemId || undefined, invoiceItemDraftId: item.invoiceItemDraftId || undefined })) })),
  };
  return draft;
}
