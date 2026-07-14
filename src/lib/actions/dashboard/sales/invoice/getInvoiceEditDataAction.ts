"use server";

import { Prisma, ProductMediaKind } from "@prisma/client";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import type { InvoiceDraftData } from "@/lib/types/Invoicetable";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

function normalizeInvoiceDraftData(
  value: Prisma.JsonValue,
): InvoiceDraftData | undefined {
  if (!value) return undefined;

  let parsed: unknown = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return undefined;
  }

  return parsed as InvoiceDraftData;
}

export type MediaItem = {
  id?: string;
  kind: ProductMediaKind;
  url: string;
  title?: string | null;
};

export async function getInvoiceEditDataAction(invoiceId: string) {
  await requireAuth();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNo: true,
        invoiceFy: true,
        status: true,
        invoiceDate: true,
        poNumber: true,
        poDate: true,
        clientNameSnapshot: true,
        citySnapshot: true,
        stateSnapshot: true,
        gstinSnapshot: true,
        dispatchDate: true,
        transporterName: true,
        vehicleNumber: true,
        driverName: true,
        driverPhone: true,
        dispatchThrough: true,
        lrNumber: true,
        transportationPayment: true,
        transportationAmount: true,
        remarks: true,
        ewayBill: true,
        salesOrderId: true,
        customerId: true,
        subtotal: true,
        gstTotal: true,
        grandTotal: true,
        draftData: true,
        lrCopy: {
          select: {
            id: true,
            kind: true,
            url: true,
            title: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            orderNo: true,
            orderFy: true,
            poNumber: true,
            customerId: true,
            items: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                productId: true,
                variantId: true,
                title: true,
                sku: true,
                typeNumber: true,
                description: true,
                hsnCode: true,
                unit: true,
                qty: true,
                invoicedQty: true,
                dispatchedQty: true,
                pendingQty: true,
                unitPrice: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    const pendingItems = invoice.salesOrder?.items
      ?.map((item) => {
        const qty = Number(item.qty ?? 0);
        const invoicedQty = Number(item.invoicedQty ?? 0);
        const dispatchedQty = Number(item.dispatchedQty ?? 0);
        const pendingQty = Number(item.pendingQty ?? 0);
        const remainingQty = Math.max(qty - invoicedQty, 0);

        return {
          ...item,
          qty,
          invoicedQty,
          dispatchedQty,
          pendingQty,
          unitPrice: Number(item.unitPrice ?? 0),
          remainingQty,
        };
      })
      .filter((item) => item.remainingQty > 0) ?? [];

    const lrCopy: MediaItem[] = invoice.lrCopy
      .filter((item) => item.kind && item.url)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        url: item.url,
        title: item.title ?? null,
      }));

    const draftData = normalizeInvoiceDraftData(invoice.draftData);

    return {
      ok: true as const,
      invoice: serializeForClient({
        ...invoice,
        subtotal: Number(invoice.subtotal ?? 0),
        gstTotal: Number(invoice.gstTotal ?? 0),
        grandTotal: Number(invoice.grandTotal ?? 0),
        transportationAmount:
          invoice.transportationAmount === null ||
          invoice.transportationAmount === undefined
            ? null
            : Number(invoice.transportationAmount),
        lrCopy,
        draftData,
        pendingItems,
      }),
    };
  } catch (error) {
    console.error("getInvoiceEditDataAction", error);
    return { ok: false as const, message: "Failed to load invoice" };
  }
}
