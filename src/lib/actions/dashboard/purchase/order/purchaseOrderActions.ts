"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import transporter from "@/lib/email/nodemailer";
import { escapeEmailHtml, renderThemedEmailLayout } from "@/lib/email/themeTemplate";
import { getFinancialYearLabel, formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import type { PurchaseOrderDraft } from "@/lib/types/PurchaseOrderTypes";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const date = (value?: string | null) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : null;

function calculate(draft: PurchaseOrderDraft) {
  const items = draft.items.map((item, index) => {
    const qty = Math.max(0, number(item.qty));
    const unitPrice = Math.max(0, number(item.unitPrice));
    const discountPercent = Math.min(100, Math.max(0, number(item.discountPercent)));
    const gstPercent = Math.min(100, Math.max(0, number(item.gstPercent)));
    const lineSubtotal = round2(qty * unitPrice);
    const lineDiscount = round2(lineSubtotal * discountPercent / 100);
    const lineTaxable = round2(lineSubtotal - lineDiscount);
    const lineGst = round2(lineTaxable * gstPercent / 100);
    return { ...item, qty, unitPrice, discountPercent, gstPercent, lineSubtotal, lineDiscount, lineTaxable, lineGst, lineTotal: round2(lineTaxable + lineGst), sortOrder: index };
  });
  const subtotal = round2(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const discountTotal = round2(items.reduce((sum, item) => sum + item.lineDiscount, 0));
  const taxableTotal = round2(items.reduce((sum, item) => sum + item.lineTaxable, 0));
  const gstTotal = round2(items.reduce((sum, item) => sum + item.lineGst, 0));
  const shippingAmount = Math.max(0, number(draft.shippingAmount));
  return { items, subtotal, discountTotal, taxableTotal, gstTotal, shippingAmount, grandTotal: round2(taxableTotal + gstTotal + shippingAmount) };
}

async function validate(draft: PurchaseOrderDraft) {
  if (!draft.supplierId) throw new Error("Select a supplier.");
  if (!draft.items.length) throw new Error("Add at least one material.");
  if (draft.items.some((item) => !item.rawMaterialId || number(item.qty) <= 0)) throw new Error("Every row needs a material and quantity greater than zero.");
  const supplier = await prisma.supplier.findFirst({ where: { id: draft.supplierId, deletedAt: null }, select: { id: true, companyName: true, companyEmail: true, companyPhone: true, addressLine1: true, addressLine2: true, city: true, state: true, country: true, pincode: true, gstin: true } });
  if (!supplier) throw new Error("Selected supplier no longer exists.");
  const materialIds = [...new Set(draft.items.map((item) => item.rawMaterialId!))];
  const materials = await prisma.rawMaterial.count({ where: { id: { in: materialIds }, deletedAt: null } });
  if (materials !== materialIds.length) throw new Error("One or more selected materials no longer exist.");
  return supplier;
}

export async function savePurchaseOrderAction(input: { id?: string; draft: PurchaseOrderDraft; finalize?: boolean }) {
  const session = await requireAuth();
  try {
    const supplier = await validate(input.draft);
    const totals = calculate(input.draft);
    const snapshot = [supplier.addressLine1, supplier.addressLine2, supplier.city, supplier.state, supplier.pincode, supplier.country].filter(Boolean).join(", ");
    const common = {
      orderDate: date(input.draft.orderDate) ?? new Date(), expectedDate: date(input.draft.expectedDate), supplierId: supplier.id,
      supplierName: supplier.companyName, supplierEmail: supplier.companyEmail, supplierPhone: supplier.companyPhone, supplierAddress: snapshot, supplierGstin: supplier.gstin,
      paymentTerms: input.draft.paymentTerms?.trim() || null, deliveryTerms: input.draft.deliveryTerms?.trim() || null, shippingAddress: input.draft.shippingAddress?.trim() || null,
      remarks: input.draft.remarks?.trim() || null, terms: input.draft.terms?.trim() || null, draftData: input.draft as Prisma.InputJsonValue,
      subtotal: totals.subtotal, discountTotal: totals.discountTotal, taxableTotal: totals.taxableTotal, gstTotal: totals.gstTotal, shippingAmount: totals.shippingAmount, grandTotal: totals.grandTotal,
      status: input.finalize ? "FINALIZED" as const : "DRAFT" as const, finalizedAt: input.finalize ? new Date() : null, updatedById: session.user.id,
    };
    const order = await prisma.$transaction(async (tx) => {
      if (input.id) {
        const existing = await tx.purchaseOrder.findUnique({ where: { id: input.id }, select: { status: true } });
        if (!existing) throw new Error("Purchase order not found.");
        if (existing.status !== "DRAFT") throw new Error("Only draft purchase orders can be edited.");
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: input.id } });
        return tx.purchaseOrder.update({ where: { id: input.id }, data: { ...common, draftVersion: { increment: 1 }, items: { create: totals.items.map((item) => ({ rawMaterialId: item.rawMaterialId!, title: item.title.trim() || "Material", supplierItemName: item.supplierItemName?.trim() || null, itemCode: item.itemCode?.trim() || null, hsnCode: item.hsnCode?.trim() || null, unit: item.unit || "Nos", qty: item.qty, unitPrice: item.unitPrice, discountPercent: item.discountPercent, gstPercent: item.gstPercent, lineSubtotal: item.lineSubtotal, lineDiscount: item.lineDiscount, lineTaxable: item.lineTaxable, lineGst: item.lineGst, lineTotal: item.lineTotal, remarks: item.remarks?.trim() || null, sortOrder: item.sortOrder })) } }, select: { id: true } });
      }
      const fy = getFinancialYearLabel(date(input.draft.orderDate) ?? new Date());
      const counter = await tx.fiscalCounter.upsert({ where: { key: `PO:${fy}` }, create: { key: `PO:${fy}`, value: 1 }, update: { value: { increment: 1 } }, select: { value: true } });
      return tx.purchaseOrder.create({ data: { ...common, poNo: counter.value, poFy: fy, createdById: session.user.id, items: { create: totals.items.map((item) => ({ rawMaterialId: item.rawMaterialId!, title: item.title.trim() || "Material", supplierItemName: item.supplierItemName?.trim() || null, itemCode: item.itemCode?.trim() || null, hsnCode: item.hsnCode?.trim() || null, unit: item.unit || "Nos", qty: item.qty, unitPrice: item.unitPrice, discountPercent: item.discountPercent, gstPercent: item.gstPercent, lineSubtotal: item.lineSubtotal, lineDiscount: item.lineDiscount, lineTaxable: item.lineTaxable, lineGst: item.lineGst, lineTotal: item.lineTotal, remarks: item.remarks?.trim() || null, sortOrder: item.sortOrder })) } }, select: { id: true } });
    });
    revalidatePath("/dashboard/purchase/orders");
    return { ok: true as const, id: order.id };
  } catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "Could not save purchase order." }; }
}

export async function cancelPurchaseOrderAction(id: string) {
  await requireAuth();
  const order = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
  if (!order) return { ok: false as const, message: "Purchase order not found." };
  if (order.status === "CANCELLED") return { ok: false as const, message: "Purchase order is already cancelled." };
  await prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  revalidatePath("/dashboard/purchase/orders"); revalidatePath(`/dashboard/purchase/orders/${id}`);
  return { ok: true as const };
}

export async function sendPurchaseOrderAction(id: string, recipient: string, message?: string) {
  await requireAuth();
  try {
    const email = recipient.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false as const, message: "Enter a valid recipient email." };
    const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
    if (!order) return { ok: false as const, message: "Purchase order not found." };
    if (order.status === "DRAFT" || order.status === "CANCELLED") return { ok: false as const, message: "Finalize the purchase order before sending it." };
    const poNumber = formatFinancialDocumentNumber(order.poFy, order.poNo);
    const money = (value: unknown) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(number(value));
    const rows = order.items.map((item, i) => `<tr><td style="padding:8px;border:1px solid #d7e0ea">${i + 1}</td><td style="padding:8px;border:1px solid #d7e0ea">${escapeEmailHtml(item.title)}</td><td style="padding:8px;border:1px solid #d7e0ea;text-align:right">${number(item.qty)} ${escapeEmailHtml(item.unit)}</td><td style="padding:8px;border:1px solid #d7e0ea;text-align:right">${money(item.unitPrice)}</td><td style="padding:8px;border:1px solid #d7e0ea;text-align:right">${money(item.lineTotal)}</td></tr>`).join("");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
    const copyUrl = `${baseUrl}/purchase-orders/${id}`;
    const subject = `Purchase Order ${poNumber} - Explosion Proof Electrical Control`;
    const html = renderThemedEmailLayout({ title: `Purchase Order ${poNumber}`, preheader: `Purchase order for ${order.supplierName}`, bodyHtml: `<p>Dear ${escapeEmailHtml(order.supplierName)},</p><p>${escapeEmailHtml(message?.trim() || "Please find our purchase order details below. Kindly confirm acceptance and the expected delivery date.")}</p><table style="width:100%;border-collapse:collapse;margin:18px 0"><thead><tr style="background:#f0f5f9"><th style="padding:8px;border:1px solid #d7e0ea">#</th><th style="padding:8px;border:1px solid #d7e0ea">Material</th><th style="padding:8px;border:1px solid #d7e0ea">Qty</th><th style="padding:8px;border:1px solid #d7e0ea">Rate</th><th style="padding:8px;border:1px solid #d7e0ea">Amount</th></tr></thead><tbody>${rows}</tbody></table><p style="text-align:right;font-size:18px"><strong>Total: ${money(order.grandTotal)}</strong></p>${baseUrl ? `<p><a href="${escapeEmailHtml(copyUrl)}" style="display:inline-block;padding:11px 16px;background:#164d78;color:white;text-decoration:none;border-radius:6px">View / Print Purchase Order</a></p>` : ""}<p>Regards,<br/>Explosion Proof Electrical Control</p>` });
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER, to: email, subject, html });
    await prisma.purchaseOrder.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), sentTo: email, emailSubject: subject } });
    revalidatePath(`/dashboard/purchase/orders/${id}`); revalidatePath("/dashboard/purchase/orders");
    return { ok: true as const };
  } catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "Could not send purchase order." }; }
}

export async function createGrnFromPurchaseOrderAction(id: string) {
  const session = await requireAuth();
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
    if (!order || order.status === "DRAFT" || order.status === "CANCELLED") return { ok: false as const, message: "Only active finalized purchase orders can be received." };
    const fy = getFinancialYearLabel(new Date());
    const created = await prisma.$transaction(async (tx) => {
      const counter = await tx.fiscalCounter.upsert({ where: { key: `GRN:${fy}` }, create: { key: `GRN:${fy}`, value: 1 }, update: { value: { increment: 1 } }, select: { value: true } });
      const draft = { header: { receivedAt: new Date().toISOString(), supplierId: order.supplierId, supplierName: order.supplierName, supplierInvoiceNo: "", supplierInvoiceDate: "", supplierInvoiceFiles: [], transporterName: "", lrNumber: "", transportationPaid: false, transportationPaidAmount: null, remarks: `Against purchase order ${formatFinancialDocumentNumber(order.poFy, order.poNo)}` }, items: order.items.map((item) => ({ id: crypto.randomUUID(), rawMaterialId: item.rawMaterialId, title: item.title, supplierItemName: item.supplierItemName, sku: item.itemCode, hsnCode: item.hsnCode, unit: item.unit, qty: number(item.qty), unitCost: number(item.unitPrice), discountPercent: number(item.discountPercent), grossAmount: number(item.lineSubtotal), discountAmount: number(item.lineDiscount), effectiveUnitCost: number(item.qty) > 0 ? round2(number(item.lineTaxable) / number(item.qty)) : 0, lineTotal: number(item.lineTaxable), sortOrder: item.sortOrder })) };
      return tx.goodsReceiptNote.create({ data: { grnNo: counter.value, grnFy: fy, status: "DRAFT", purchaseOrderId: order.id, draftData: draft, draftVersion: 0, createdById: session.user.id, updatedById: session.user.id }, select: { id: true } });
    });
    return { ok: true as const, id: created.id };
  } catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "Could not create GRN." }; }
}
