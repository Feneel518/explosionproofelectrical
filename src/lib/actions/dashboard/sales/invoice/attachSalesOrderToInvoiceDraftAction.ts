"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { InvoiceDraftData } from "@/lib/types/Invoicetable";

import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";
import { getInvoiceEditDataAction } from "./getInvoiceEditDataAction";
import { resolveSalesOrderCustomerSnapshot } from "./resolveSalesOrderCustomerSnapshot";

export async function attachSalesOrderToInvoiceDraftAction(
  invoiceId: string,
  salesOrderId: string,
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
            invoiceDate: true,
            dispatchDate: true,
            transporterName: true,
            vehicleNumber: true,
            driverName: true,
            driverPhone: true,
            dispatchThrough: true,
            lrNumber: true,
            remarks: true,
            ewayBill: true,
            transportationPayment: true,
            transportationAmount: true,
            customerId: true,
            draftVersion: true,
            draftData: true,
            lrCopy: {
              select: {
                kind: true,
                url: true,
                title: true,
              },
            },
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

        if (invoice.salesOrderId) {
          return {
            ok: false as const,
            message: "This invoice is already linked to a sales order",
          };
        }

        const order = await tx.salesOrder.findUnique({
          where: { id: salesOrderId },
          select: {
            id: true,
            status: true,
            orderVersion: true,
            customerId: true,
            clientName: true,
            poNumber: true,
            poDate: true,
            clientNameSnapshot: true,
            citySnapshot: true,
            stateSnapshot: true,
            gstinSnapshot: true,
            transportationPayment: true,
            customer: {
              select: {
                companyName: true,
                city: true,
                state: true,
                gstin: true,
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
                unitPrice: true,
                sortOrder: true,
              },
            },
          },
        });

        if (!order) {
          return { ok: false as const, message: "Sales order not found" };
        }

        if (order.status === "CANCELLED") {
          return {
            ok: false as const,
            message: "Cancelled order cannot be invoiced",
          };
        }

        const invoiceableItems = order.items
          .map((item) => {
            const remainingQty = Math.max(item.qty - item.invoicedQty, 0);

            return {
              ...item,
              remainingQty,
            };
          })
          .filter((item) => item.remainingQty > 0);

        if (!invoiceableItems.length) {
          return {
            ok: false as const,
            message: "No remaining quantity left to invoice",
          };
        }

        const customerSnapshot = resolveSalesOrderCustomerSnapshot(order);

        const draftItems: InvoiceDraftData["items"] = invoiceableItems.map(
          (item, index) => ({
            id: crypto.randomUUID(),
            salesOrderItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            title: item.title ?? "",
            sku: item.sku ?? null,
            typeNumber: item.typeNumber ?? null,
            description: item.description ?? null,
            hsnCode: item.hsnCode ?? null,
            unit: item.unit ?? null,
            orderedQty: item.qty,
            alreadyInvoiced: item.invoicedQty,
            alreadyDispatched: item.dispatchedQty,
            remainingQty: item.remainingQty,
            qty: item.remainingQty,
            cimfrNumber: null,
            pesoNumber: null,
            serialNumber: null,
            productPicture: [],
            selected: false,
            unitPrice: Number(item.unitPrice || 0),
            lineSubtotal: Number(item.remainingQty) * Number(item.unitPrice || 0),
            lineGstTotal: 0,
            lineGrandTotal:
              Number(item.remainingQty) * Number(item.unitPrice || 0),
            sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
          }),
        );

        const subtotal = draftItems.reduce(
          (acc, item) => acc + Number(item.lineSubtotal ?? 0),
          0,
        );
        const gstTotal = draftItems.reduce(
          (acc, item) => acc + Number(item.lineGstTotal ?? 0),
          0,
        );
        const grandTotal = subtotal + gstTotal;

        const draftData = (invoice.draftData ?? {}) as Partial<InvoiceDraftData>;

        const nextDraftData: InvoiceDraftData = {
          header: {
            salesOrderId: order.id,
            customerId: order.customerId ?? null,
            invoiceDate:
              draftData.header?.invoiceDate ?? invoice.invoiceDate.toISOString(),
            dueDate: null,
            poNumber: order.poNumber ?? "",
            poDate: order.poDate ? order.poDate.toISOString() : null,
            ...customerSnapshot,
            dispatchDate:
              draftData.header?.dispatchDate ??
              (invoice.dispatchDate ? invoice.dispatchDate.toISOString() : null),
            transporterName:
              draftData.header?.transporterName ?? invoice.transporterName ?? null,
            vehicleNumber:
              draftData.header?.vehicleNumber ?? invoice.vehicleNumber ?? null,
            driverName: draftData.header?.driverName ?? invoice.driverName ?? null,
            driverPhone:
              draftData.header?.driverPhone ?? invoice.driverPhone ?? null,
            dispatchThrough:
              draftData.header?.dispatchThrough ??
              invoice.dispatchThrough ??
              null,
            lrNumber: draftData.header?.lrNumber ?? invoice.lrNumber ?? null,
            remarks: draftData.header?.remarks ?? invoice.remarks ?? null,
            ewayBill: draftData.header?.ewayBill ?? invoice.ewayBill ?? null,
            transportationPayment:
              draftData.header?.transportationPayment ??
              invoice.transportationPayment ??
              order.transportationPayment ??
              "TO_PAY",
            transportationAmount:
              draftData.header?.transportationAmount ??
              (invoice.transportationAmount !== null &&
              invoice.transportationAmount !== undefined
                ? Number(invoice.transportationAmount)
                : null),
            lrCopy:
              draftData.header?.lrCopy ??
              invoice.lrCopy.map((item) => ({
                kind: item.kind,
                url: item.url,
                title: item.title ?? null,
              })),
            subtotal,
            discountTotal: 0,
            taxableTotal: subtotal,
            gstTotal,
            grandTotal,
          },
          items: draftItems,
          packages: [],
        };

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            salesOrderId: order.id,
            salesOrderVersionSnapshot: order.orderVersion,
            customerId: order.customerId ?? invoice.customerId ?? null,
            poNumber: order.poNumber ?? null,
            poDate: order.poDate ?? null,
            clientNameSnapshot: customerSnapshot.clientNameSnapshot || null,
            citySnapshot: customerSnapshot.citySnapshot || null,
            stateSnapshot: customerSnapshot.stateSnapshot || null,
            gstinSnapshot: customerSnapshot.gstinSnapshot || null,
            transportationPayment:
              nextDraftData.header.transportationPayment === "PAID"
                ? "PAID"
                : "TO_PAY",
            transportationAmount:
              nextDraftData.header.transportationAmount ?? null,
            subtotal,
            discountTotal: 0,
            taxableTotal: subtotal,
            gstTotal,
            grandTotal,
            draftData: nextDraftData,
            draftVersion: Math.max(1, Number(invoice.draftVersion ?? 0)) + 1,
          },
        });

        return { ok: true as const };
      },
      INVOICE_TRANSACTION_OPTIONS,
    );

    if (!result.ok) {
      return result;
    }

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}/edit`);

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
    console.error("attachSalesOrderToInvoiceDraftAction", error);
    return {
      ok: false as const,
      message: "Failed to attach sales order to invoice draft",
    };
  }
}
