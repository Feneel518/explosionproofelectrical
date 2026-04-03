"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { Prisma } from "@prisma/client";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

type ProductMediaKind = string;

export type MediaItem = {
  id: string;
  kind: ProductMediaKind;
  url: string;
  title: string | null;
};

export type InvoiceDraftData = {
  header?: {
    invoiceNo?: number | null;
    invoiceDate?: string | null;
    dispatchDate?: string | null;
    poNumber?: string | null;
    transporterName?: string | null;
    vehicleNumber?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    dispatchThrough?: string | null;
    lrNumber?: string | null;
    remarks?: string | null;
    ewayBill?: string | null;
    lrCopy?: MediaItem[];
  };
  items?: Array<{
    salesOrderItemId?: string;
    selected?: boolean;
    invoiceQty?: number;
    typeNumber?: string | null;
    cimfrNumber?: string | null;
    serialNumber?: string | null;
    itemPhotos?: MediaItem[];
    packing?: Array<{
      boxNumber?: string | null;
      quantity?: number | null;
      notes?: string | null;
    }>;
  }>;
};

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

export async function getInvoiceByIdAction(invoiceId: string) {
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
        dispatchDate: true,
        poNumber: true,
        poDate: true,
        emailedAt: true,
        emailedTo: true,
        emailSubject: true,
        paymentReceived: true,
        paymentReceivedAt: true,
        paymentReminderLastSentAt: true,
        paymentReminderCount: true,

        clientNameSnapshot: true,
        citySnapshot: true,
        stateSnapshot: true,
        gstinSnapshot: true,

        transporterName: true,
        vehicleNumber: true,
        driverName: true,
        driverPhone: true,
        dispatchThrough: true,
        lrNumber: true,
        remarks: true,
        ewayBill: true,

        subtotal: true,
        gstTotal: true,
        grandTotal: true,

        salesOrderId: true,
        draftData: true,
        customer: {
          select: {
            id: true,
            companyName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            gstin: true,
            companyPhone: true,
            companyEmail: true,
          },
        },

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
            poDate: true,
            poNumber: true,
            paymentTerms: true,
            customerId: true,
            clientNameSnapshot: true,
            citySnapshot: true,
            stateSnapshot: true,
            gstinSnapshot: true,
            receivedFromName: true,
            receivedFromPhone: true,
            receivedFromEmail: true,
            customer: {
              select: {
                id: true,
                companyName: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
                gstin: true,
                companyPhone: true,
                companyEmail: true,
              },
            },
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

        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            salesOrderItemId: true,
            title: true,
            description: true,
            sku: true,
            typeNumber: true,
            cimfrNumber: true,
            serialNumber: true,
            hsnCode: true,
            unit: true,
            qty: true,
            alreadyDispatched: true,
            lineGrandTotal: true,
            lineGstTotal: true,
            lineSubtotal: true,

            // invoiceQty: true,
            // dispatchedQty: true,
            unitPrice: true,
            // lineTotal: true,
            sortOrder: true,
            // packing: true,
            productPicture: {
              select: {
                id: true,
                kind: true,
                url: true,
                title: true,
              },
            },
          },
        },

        packages: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            packageNo: true,
            packageType: true,
            label: true,
            remarks: true,
            grossWeight: true,
            netWeight: true,
            sortOrder: true,
            items: {
              select: {
                id: true,
                qty: true,
                invoiceItemId: true,
                invoiceItem: {
                  select: {
                    id: true,
                    title: true,
                    sku: true,
                    typeNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    const pendingItems =
      invoice.salesOrder?.items
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
        kind: item.kind as string,
        url: item.url!,
        title: item.title ?? null,
      }));

    const items = invoice.items.map((item) => ({
      ...item,
      invoiceQty: Number(item.qty ?? 0),
      dispatchedQty: Number(item.alreadyDispatched ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      lineTotal: Number(item.lineSubtotal ?? 0),
      photos: item.productPicture
        .filter((photo) => photo.kind && photo.url)
        .map((photo) => ({
          id: photo.id,
          kind: photo.kind as string,
          url: photo.url!,
          title: photo.title ?? null,
        })),
    }));

    const draftData = normalizeInvoiceDraftData(invoice.draftData);

    const packages = invoice.packages.map((pkg) => ({
      id: pkg.id,
      packageNo: pkg.packageNo,
      packageType: pkg.packageType,
      label: pkg.label,
      remarks: pkg.remarks,
      grossWeight:
        pkg.grossWeight === null || pkg.grossWeight === undefined
          ? null
          : Number(pkg.grossWeight),
      netWeight:
        pkg.netWeight === null || pkg.netWeight === undefined
          ? null
          : Number(pkg.netWeight),
      sortOrder: pkg.sortOrder,
      items: pkg.items.map((pkgItem) => ({
        id: pkgItem.id,
        qty: pkgItem.qty,
        invoiceItemId: pkgItem.invoiceItemId,
        title: pkgItem.invoiceItem?.title ?? null,
        sku: pkgItem.invoiceItem?.sku ?? null,
        typeNumber: pkgItem.invoiceItem?.typeNumber ?? null,
      })),
    }));

    return {
      ok: true as const,
      invoice: serializeForClient({
        ...invoice,
        subtotal: Number(invoice.subtotal ?? 0),
        gstTotal: Number(invoice.gstTotal ?? 0),
        grandTotal: Number(invoice.grandTotal ?? 0),
        lrCopy,
        items,
        packages,
        pendingItems,
        draftData,
      }),
    };
  } catch (error) {
    console.error("getInvoiceByIdAction", error);
    return { ok: false as const, message: "Failed to load invoice" };
  }
}
