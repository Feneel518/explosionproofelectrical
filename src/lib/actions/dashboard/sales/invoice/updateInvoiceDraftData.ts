"use server";

import { normalizeInvoiceDraft } from "@/lib/invoices/draft";
import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { ProductMediaKind } from "@prisma/client";
import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";

type DraftMedia = {
  kind: ProductMediaKind;
  url: string;
  title?: string | null;
};

type DraftItem = {
  salesOrderItemId: string;
  isManual?: boolean;
  productId?: string | null;
  variantId?: string | null;
  selected?: boolean;
  title: string;
  sku?: string | null;
  typeNumber?: string | null;
  description?: string | null;
  hsnCode?: string | null;
  unit?: string | null;
  orderedQty: number;
  alreadyInvoiced: number;
  alreadyDispatched: number;
  remainingQty: number;
  qty: number;
  cimfrNumber?: string | null;
  pesoNumber?: string | null;
  serialNumber?: string | null;
  selectedSerialIds?: string[];
  productPicture?: DraftMedia[];
  unitPrice: number;
  lineSubtotal: number;
  lineGstTotal?: number;
  lineGrandTotal?: number;
  sortOrder: number;
};

type DraftPackageItem = {
  salesOrderItemId: string;
  qty: number;
};

type DraftPackage = {
  packageNo: string;
  packageType?: string | null;
  label?: string | null;
  remarks?: string | null;
  grossWeight?: number | null;
  netWeight?: number | null;
  items: DraftPackageItem[];
};

type DraftHeader = {
  customerId?: string | null;
  clientNameSnapshot?: string | null;
  citySnapshot?: string | null;
  stateSnapshot?: string | null;
  gstinSnapshot?: string | null;
  invoiceNo: number;
  invoiceDate: string;
  dispatchDate?: string | null;
  poNumber?: string | null;
  poDate?: string | null;
  transporterName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  dispatchThrough?: string | null;
  lrNumber?: string | null;
  ewayBill?: string | null;
  transportationPayment?: "PAID" | "TO_PAY";
  transportationAmount?: number | null;
  remarks?: string | null;
  lrCopy?: DraftMedia[];
  discountType?: "PERCENTAGE" | "AMOUNT";
  discountValue?: number;
  gstMode?: string;
  subtotal: number;
  taxableTotal: number;
  gstTotal: number;
  grandTotal: number;
};

function normalizeIdOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeTransportationAmount(value?: number | null) {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Number(amount.toFixed(2));
}

export type UpdateInvoiceDraftPayload = {
  header: DraftHeader;
  items: DraftItem[];
  packages: DraftPackage[];
};

export async function updateInvoiceDraftAction(
  invoiceId: string,
  payload: UpdateInvoiceDraftPayload,
  clientVersion: number,
) {
  await requirePermission("accounts.write");

  try {
    if (!Number.isInteger(clientVersion) || clientVersion < 0) throw new Error("Reload the invoice before saving.");
    const result = await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          invoiceFy: true,
          status: true,
          customerId: true,
          draftVersion: true,
          gstMode: true,
          salesOrder: { select: { gst: true } },
        },
      });

      if (!invoice) {
        return { ok: false as const, message: "Invoice not found" };
      }

      if (invoice.status !== "DRAFT") {
        return {
          ok: false as const,
          message: "Reopen the invoice before editing it",
        };
      }

      const normalized = normalizeInvoiceDraft(payload, invoice.salesOrder?.gst ?? invoice.gstMode);
      const duplicate = await tx.invoice.findFirst({
        where: {
          invoiceFy: invoice.invoiceFy,
          invoiceNo: payload.header.invoiceNo,
          NOT: { id: invoiceId },
        },
        select: { id: true },
      });

      if (duplicate) {
        return {
          ok: false as const,
          message: `Invoice number ${payload.header.invoiceNo} already exists in ${invoice.invoiceFy}`,
        };
      }

        const updated = await tx.invoice.update({
          where: { id: invoiceId, status: "DRAFT", draftVersion: clientVersion },
          data: {
            customerId:
              normalizeIdOrNull(payload.header.customerId) ??
              invoice.customerId ??
              null,
            invoiceNo: payload.header.invoiceNo,
            invoiceDate: new Date(payload.header.invoiceDate),
            dispatchDate: payload.header.dispatchDate
              ? new Date(payload.header.dispatchDate)
              : null,

            poNumber: payload.header.poNumber || null,
            poDate: payload.header.poDate
              ? new Date(payload.header.poDate)
              : null,
            clientNameSnapshot: payload.header.clientNameSnapshot || null,
            citySnapshot: payload.header.citySnapshot || null,
            stateSnapshot: payload.header.stateSnapshot || null,
            gstinSnapshot: payload.header.gstinSnapshot || null,
            transporterName: payload.header.transporterName || null,
            vehicleNumber: payload.header.vehicleNumber || null,
            driverName: payload.header.driverName || null,
            driverPhone: payload.header.driverPhone || null,
            dispatchThrough: payload.header.dispatchThrough || null,
            lrNumber: payload.header.lrNumber || null,
            ewayBill: payload.header.ewayBill || null,
            transportationPayment:
              payload.header.transportationPayment === "PAID"
                ? "PAID"
                : "TO_PAY",
            transportationAmount: normalizeTransportationAmount(
              payload.header.transportationAmount,
            ),
            remarks: payload.header.remarks || null,

            subtotal: normalized.header.subtotal,
            taxableTotal: normalized.header.taxableTotal,
            gstTotal: normalized.header.gstTotal,
            grandTotal: normalized.header.grandTotal,

            draftData: normalized,
            gstMode: normalized.header.gstMode,
            discountTotal: normalized.header.discountTotal,
            draftVersion: { increment: 1 },
          },
        });

        return { ok: true as const, serverVersion: updated.draftVersion };
      },
      INVOICE_TRANSACTION_OPTIONS,
    );

    return result;
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") return { ok: false as const, code: "VERSION_CONFLICT" as const, message: "This invoice changed in another tab. Your entries are still here; reload to review the latest version before saving." };
    console.error("updateInvoiceDraftAction", error);
    return { ok: false as const, message: "Failed to save invoice draft" };
  }
}
