"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { getFinancialYearLabelFromStartYear } from "@/lib/helpers/globalHelpers/financialYear";
import { InvoiceDraftData } from "@/lib/types/Invoicetable";
import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";

function getFinancialYearStartYear(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
}

export const createDraftInvoiceAction = async (salesOrderId: string) => {
  await requireAuth();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const order = await tx.salesOrder.findUnique({
          where: { id: salesOrderId },
          select: {
            id: true,
            status: true,
            orderVersion: true,
            customerId: true,
            poNumber: true,
            poDate: true,
            clientNameSnapshot: true,
            citySnapshot: true,
            stateSnapshot: true,
            gstinSnapshot: true,
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

        const fyStartYear = getFinancialYearStartYear();
        const invoiceFy = getFinancialYearLabelFromStartYear(fyStartYear);

        const latestInvoiceInFy = await tx.invoice.findFirst({
          where: { invoiceFy },
          orderBy: { invoiceNo: "desc" },
          select: { invoiceNo: true },
        });

        const invoiceNo = (latestInvoiceInFy?.invoiceNo ?? 0) + 1;

        const draftItems: InvoiceDraftData["items"] = invoiceableItems.map(
          (item, index) => {
            return {
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
              lineSubtotal:
                Number(item.remainingQty) * Number(item.unitPrice || 0),
              lineGstTotal: 0,
              lineGrandTotal:
                Number(item.remainingQty) * Number(item.unitPrice || 0),
              sortOrder: Number.isFinite(item.sortOrder)
                ? item.sortOrder
                : index,
            };
          },
        );
        const subtotal = draftItems.reduce(
          (acc, item) => acc + item.lineSubtotal,
          0,
        );
        const gstTotal = draftItems.reduce(
          (acc, item) => acc + item.lineGstTotal,
          0,
        );
        const grandTotal = subtotal + gstTotal;

        const draftData: InvoiceDraftData = {
          header: {
            salesOrderId: order.id,
            customerId: order.customerId ?? null,
            invoiceDate: new Date().toISOString(),
            dueDate: null,
            poNumber: order.poNumber ?? "",
            poDate: order.poDate ? order.poDate.toISOString() : null,
            clientNameSnapshot: order.clientNameSnapshot ?? "",
            citySnapshot: order.citySnapshot ?? "",
            stateSnapshot: order.stateSnapshot ?? "",
            gstinSnapshot: order.gstinSnapshot ?? "",
            dispatchDate: null,
            transporterName: null,
            vehicleNumber: null,
            driverName: null,
            driverPhone: null,
            dispatchThrough: null,
            lrNumber: null,
            remarks: null,
            subtotal,
            discountTotal: 0,
            taxableTotal: subtotal,
            gstTotal,
            grandTotal,
          },
          items: draftItems,
          packages: [],
        };

        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            invoiceFy,
            status: "DRAFT",
            salesOrderId: order.id,
            salesOrderVersionSnapshot: order.orderVersion,
            customerId: order.customerId ?? null,

            invoiceDate: new Date(),

            poNumber: order.poNumber ?? null,
            poDate: order.poDate ?? null,
            clientNameSnapshot: order.clientNameSnapshot ?? null,
            citySnapshot: order.citySnapshot ?? null,
            stateSnapshot: order.stateSnapshot ?? null,
            gstinSnapshot: order.gstinSnapshot ?? null,

            subtotal,
            discountTotal: 0,
            taxableTotal: subtotal,
            gstTotal,
            grandTotal,

            draftData,
            draftVersion: 1,
          },
          select: { id: true },
        });

        return { ok: true as const, id: invoice.id };
      },
      INVOICE_TRANSACTION_OPTIONS,
    );

    return result;
  } catch (error) {
    console.error("createDraftInvoiceAction", error);
    return { ok: false as const, message: "Failed to create invoice draft" };
  }
};
