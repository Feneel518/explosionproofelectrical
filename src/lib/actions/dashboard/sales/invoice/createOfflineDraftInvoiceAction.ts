"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabelFromStartYear } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import { InvoiceDraftData } from "@/lib/types/Invoicetable";
import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";

function getFinancialYearStartYear(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
}

export async function createOfflineDraftInvoiceAction() {
  await requireAuth();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const fyStartYear = getFinancialYearStartYear();
        const invoiceFy = getFinancialYearLabelFromStartYear(fyStartYear);

        const latestInvoiceInFy = await tx.invoice.findFirst({
          where: { invoiceFy },
          orderBy: { invoiceNo: "desc" },
          select: { invoiceNo: true },
        });

        const invoiceNo = (latestInvoiceInFy?.invoiceNo ?? 0) + 1;

        const defaultItemId = crypto.randomUUID();
        const draftItems: InvoiceDraftData["items"] = [
          {
            id: defaultItemId,
            salesOrderItemId: defaultItemId,
            isManual: true,
            productId: null,
            variantId: null,
            title: "",
            sku: null,
            typeNumber: null,
            description: null,
            hsnCode: null,
            unit: "Nos",
            orderedQty: 1,
            alreadyInvoiced: 0,
            alreadyDispatched: 0,
            remainingQty: 1,
            qty: 1,
            cimfrNumber: null,
            pesoNumber: null,
            serialNumber: null,
            productPicture: [],
            selected: true,
            unitPrice: 0,
            lineSubtotal: 0,
            lineGstTotal: 0,
            lineGrandTotal: 0,
            sortOrder: 0,
          },
        ];

        const draftData: InvoiceDraftData = {
          header: {
            salesOrderId: null,
            customerId: null,
            invoiceDate: new Date().toISOString(),
            dueDate: null,
            poNumber: "",
            poDate: null,
            clientNameSnapshot: "",
            citySnapshot: "",
            stateSnapshot: "",
            gstinSnapshot: "",
            dispatchDate: null,
            transporterName: null,
            vehicleNumber: null,
            driverName: null,
            driverPhone: null,
            dispatchThrough: null,
            lrNumber: null,
            transportationPayment: "TO_PAY",
            transportationAmount: null,
            remarks: null,
            subtotal: 0,
            discountTotal: 0,
            taxableTotal: 0,
            gstTotal: 0,
            grandTotal: 0,
          },
          items: draftItems,
          packages: [],
        };

        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            invoiceFy,
            status: "DRAFT",
            salesOrderId: null,
            customerId: null,
            invoiceDate: new Date(),
            transportationPayment: "TO_PAY",
            transportationAmount: null,
            subtotal: 0,
            discountTotal: 0,
            taxableTotal: 0,
            gstTotal: 0,
            grandTotal: 0,
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
    console.error("createOfflineDraftInvoiceAction", error);
    return { ok: false as const, message: "Failed to create offline invoice draft" };
  }
}
