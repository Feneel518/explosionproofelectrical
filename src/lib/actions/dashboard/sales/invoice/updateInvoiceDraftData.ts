"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { ProductMediaKind } from "@prisma/client";

type DraftMedia = {
  kind: ProductMediaKind;
  url: string;
  title?: string | null;
};

type DraftItem = {
  salesOrderItemId: string;
  productId?: string | null;
  variantId?: string | null;
  selected?: boolean;
  title: string;
  sku?: string | null;
  typeNumber?: string | null;
  unit?: string | null;
  orderedQty: number;
  alreadyInvoiced: number;
  alreadyDispatched: number;
  remainingQty: number;
  qty: number;
  cimfrNumber?: string | null;
  pesoNumber?: string | null;
  serialNumber?: string | null;
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
  invoiceNo: number;
  invoiceDate: string;
  dispatchDate?: string | null;
  poNumber?: string | null;
  transporterName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  dispatchThrough?: string | null;
  lrNumber?: string | null;
  ewayBill?: string | null;
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

export type UpdateInvoiceDraftPayload = {
  header: DraftHeader;
  items: DraftItem[];
  packages: DraftPackage[];
};

export async function updateInvoiceDraftAction(
  invoiceId: string,
  payload: UpdateInvoiceDraftPayload,
) {
  await requireAuth();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          invoiceFy: true,
          status: true,
        },
      });

      if (!invoice) {
        return { ok: false as const, message: "Invoice not found" };
      }

      if (invoice.status === "CANCELLED") {
        return {
          ok: false as const,
          message: "Cancelled invoice cannot be edited",
        };
      }

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

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceNo: payload.header.invoiceNo,
          invoiceDate: new Date(payload.header.invoiceDate),
          dispatchDate: payload.header.dispatchDate
            ? new Date(payload.header.dispatchDate)
            : null,

          poNumber: payload.header.poNumber || null,
          transporterName: payload.header.transporterName || null,
          vehicleNumber: payload.header.vehicleNumber || null,
          driverName: payload.header.driverName || null,
          driverPhone: payload.header.driverPhone || null,
          dispatchThrough: payload.header.dispatchThrough || null,
          lrNumber: payload.header.lrNumber || null,
          ewayBill: payload.header.ewayBill || null,
          remarks: payload.header.remarks || null,

          subtotal: payload.header.subtotal,
          taxableTotal: payload.header.taxableTotal,
          gstTotal: payload.header.gstTotal,
          grandTotal: payload.header.grandTotal,

          draftData: payload,
          draftVersion: { increment: 1 },
        },
      });

      return { ok: true as const };
    });

    return result;
  } catch (error) {
    console.error("updateInvoiceDraftAction", error);
    return { ok: false as const, message: "Failed to save invoice draft" };
  }
}
