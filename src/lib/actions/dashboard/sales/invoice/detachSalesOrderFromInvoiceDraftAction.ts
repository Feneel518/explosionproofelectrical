"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

import { getInvoiceEditDataAction } from "./getInvoiceEditDataAction";
import type { UpdateInvoiceDraftPayload } from "./updateInvoiceDraftData";
import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";

function normalizeIdOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function detachSalesOrderFromInvoiceDraftAction(
  invoiceId: string,
  payload: UpdateInvoiceDraftPayload,
) {
  await requireAuth();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          select: {
            id: true,
            status: true,
            salesOrderId: true,
            customerId: true,
            invoiceFy: true,
          },
        });

        if (!invoice) {
          return { ok: false as const, message: "Invoice not found" };
        }

        if (invoice.status !== "DRAFT") {
          return {
            ok: false as const,
            message: "Only draft invoices can be changed",
          };
        }

        if (!invoice.salesOrderId) {
          return {
            ok: false as const,
            message: "This invoice is already offline",
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

        const offlinePayload: UpdateInvoiceDraftPayload = {
          ...payload,
          header: {
            ...payload.header,
            customerId:
              normalizeIdOrNull(payload.header.customerId) ??
              invoice.customerId ??
              null,
          },
          items: payload.items.map((item, index) => ({
            ...item,
            salesOrderItemId:
              normalizeIdOrNull(item.salesOrderItemId) ?? crypto.randomUUID(),
            isManual: true,
            orderedQty: Math.max(1, Number(item.qty ?? item.orderedQty ?? 1)),
            alreadyInvoiced: 0,
            alreadyDispatched: 0,
            remainingQty: Math.max(1, Number(item.qty ?? item.remainingQty ?? 1)),
            sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
          })),
        };

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            salesOrderId: null,
            salesOrderVersionSnapshot: null,
            customerId: offlinePayload.header.customerId,
            invoiceNo: offlinePayload.header.invoiceNo,
            invoiceDate: new Date(offlinePayload.header.invoiceDate),
            dispatchDate: offlinePayload.header.dispatchDate
              ? new Date(offlinePayload.header.dispatchDate)
              : null,
            poNumber: offlinePayload.header.poNumber || null,
            clientNameSnapshot: offlinePayload.header.clientNameSnapshot || null,
            citySnapshot: offlinePayload.header.citySnapshot || null,
            stateSnapshot: offlinePayload.header.stateSnapshot || null,
            gstinSnapshot: offlinePayload.header.gstinSnapshot || null,
            transporterName: offlinePayload.header.transporterName || null,
            vehicleNumber: offlinePayload.header.vehicleNumber || null,
            driverName: offlinePayload.header.driverName || null,
            driverPhone: offlinePayload.header.driverPhone || null,
            dispatchThrough: offlinePayload.header.dispatchThrough || null,
            lrNumber: offlinePayload.header.lrNumber || null,
            ewayBill: offlinePayload.header.ewayBill || null,
            transportationPayment:
              offlinePayload.header.transportationPayment === "PAID"
                ? "PAID"
                : "TO_PAY",
            transportationAmount:
              offlinePayload.header.transportationAmount ?? null,
            remarks: offlinePayload.header.remarks || null,
            subtotal: offlinePayload.header.subtotal,
            taxableTotal: offlinePayload.header.taxableTotal,
            gstTotal: offlinePayload.header.gstTotal,
            grandTotal: offlinePayload.header.grandTotal,
            draftData: offlinePayload,
            draftVersion: { increment: 1 },
          },
        });

        return {
          ok: true as const,
          previousSalesOrderId: invoice.salesOrderId,
        };
      },
      INVOICE_TRANSACTION_OPTIONS,
    );

    if (!result.ok) {
      return result;
    }

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}/edit`);
    if (result.previousSalesOrderId) {
      revalidatePath(`/dashboard/sales/orders/${result.previousSalesOrderId}`);
    }

    const refreshed = await getInvoiceEditDataAction(invoiceId);

    if (!refreshed.ok) {
      return {
        ok: true as const,
        invoice: null,
      };
    }

    return {
      ok: true as const,
      invoice: refreshed.invoice,
    };
  } catch (error) {
    console.error("detachSalesOrderFromInvoiceDraftAction", error);
    return {
      ok: false as const,
      message: "Failed to convert invoice to offline draft",
    };
  }
}
