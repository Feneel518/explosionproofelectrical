import { NextRequest } from "next/server";
import { utils, write } from "xlsx";

import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const runtime = "nodejs";

function formatDate(value?: Date | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatCurrencyValue(value?: number | null) {
  return value === null || value === undefined ? "" : Number(value.toFixed(2));
}

export async function GET(request: NextRequest) {
  await requireAuth();

  const month = request.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Response("Missing or invalid month", { status: 400 });
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 1);

  const [purchaseRows, salesRows] = await Promise.all([
    prisma.goodsReceiptNote.findMany({
      where: {
        status: "FINALIZED",
        receivedAt: { gte: start, lt: end },
      },
      orderBy: [{ receivedAt: "asc" }, { grnNo: "asc" }],
      select: {
        grnNo: true,
        grnFy: true,
        receivedAt: true,
        supplierNameSnapshot: true,
        supplierInvoiceNo: true,
        supplierInvoiceDate: true,
        transporterName: true,
        lrNumber: true,
        transportationPaid: true,
        transportationPaidAmount: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        status: "FINALIZED",
        invoiceDate: { gte: start, lt: end },
      },
      orderBy: [{ invoiceDate: "asc" }, { invoiceNo: "asc" }],
      select: {
        invoiceNo: true,
        invoiceFy: true,
        invoiceDate: true,
        clientNameSnapshot: true,
        customer: {
          select: {
            companyName: true,
          },
        },
        transporterName: true,
        lrNumber: true,
        transportationPayment: true,
        transportationAmount: true,
      },
    }),
  ]);

  const purchaseSheetRows: Array<Record<string, string | number>> =
    purchaseRows.map((row) => ({
    "GRN No": formatFinancialDocumentNumber(row.grnFy, row.grnNo),
    "GRN Date": formatDate(row.receivedAt),
    Supplier: row.supplierNameSnapshot || "",
    "Supplier Invoice No": row.supplierInvoiceNo || "",
    "Supplier Invoice Date": formatDate(row.supplierInvoiceDate),
    "Transporter Name": row.transporterName || "",
    "LR Number": row.lrNumber || "",
    "LR Status": row.transportationPaid ? "PAID" : "NOT PAID",
    "LR Amount": formatCurrencyValue(
      row.transportationPaidAmount === null ||
        row.transportationPaidAmount === undefined
        ? null
        : Number(row.transportationPaidAmount),
    ),
    }));

  const salesSheetRows: Array<Record<string, string | number>> = salesRows.map(
    (row) => ({
    "Invoice No": formatFinancialDocumentNumber(row.invoiceFy, row.invoiceNo),
    "Invoice Date": formatDate(row.invoiceDate),
    Customer: row.customer?.companyName || row.clientNameSnapshot || "",
    "Transporter Name": row.transporterName || "",
    "LR Number": row.lrNumber || "",
    "LR Status": row.transportationPayment,
    "LR Amount": formatCurrencyValue(
      row.transportationAmount === null || row.transportationAmount === undefined
        ? null
        : Number(row.transportationAmount),
    ),
    }),
  );

  const purchaseTotal = purchaseRows.reduce(
    (sum, row) => sum + Number(row.transportationPaidAmount ?? 0),
    0,
  );
  const salesTotal = salesRows.reduce(
    (sum, row) => sum + Number(row.transportationAmount ?? 0),
    0,
  );

  purchaseSheetRows.push({
    "GRN No": "",
    "GRN Date": "",
    Supplier: "",
    "Supplier Invoice No": "",
    "Supplier Invoice Date": "",
    "Transporter Name": "",
    "LR Number": "Total",
    "LR Status": "",
    "LR Amount": formatCurrencyValue(purchaseTotal),
  });

  salesSheetRows.push({
    "Invoice No": "",
    "Invoice Date": "",
    Customer: "",
    "Transporter Name": "",
    "LR Number": "Total",
    "LR Status": "",
    "LR Amount": formatCurrencyValue(salesTotal),
  });

  const workbook = utils.book_new();
  const purchaseSheet = utils.json_to_sheet(purchaseSheetRows);
  const salesSheet = utils.json_to_sheet(salesSheetRows);

  purchaseSheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
  ];
  salesSheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
  ];

  utils.book_append_sheet(workbook, purchaseSheet, "Purchase");
  utils.book_append_sheet(workbook, salesSheet, "Sales");

  const buffer = write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lr-workbook-${month}.xlsx"`,
    },
  });
}
