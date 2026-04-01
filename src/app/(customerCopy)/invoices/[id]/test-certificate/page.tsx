import InvoiceTestCertificateCopy from "@/components/customerCopy/invoice/InvoiceTestCertificateCopy";
import { getInvoiceByIdAction } from "@/lib/actions/dashboard/sales/invoice/getInvoiceById";
import { requireAuth } from "@/lib/check/requireAuth";
import { Lora } from "next/font/google";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ items?: string }>;
}

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function parseSelectedIds(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const page: FC<PageProps> = async ({ params, searchParams }) => {
  await requireAuth();
  const { id } = await params;
  const { items } = await searchParams;

  const invoiceData = await getInvoiceByIdAction(id);

  if (!invoiceData.ok) {
    redirect("/dashboard/sales/invoices");
  }

  const selectedIds = parseSelectedIds(items);

  const selectedItems =
    selectedIds.length > 0
      ? invoiceData.invoice.items.filter((item) => selectedIds.includes(item.id))
      : invoiceData.invoice.items;

  const poNumber =
    invoiceData.invoice.poNumber ||
    invoiceData.invoice.salesOrder?.poNumber ||
    "VERBAL";
  const poDate =
    invoiceData.invoice.poDate ||
    invoiceData.invoice.salesOrder?.poDate ||
    invoiceData.invoice.invoiceDate;
  const companyName =
    invoiceData.invoice.salesOrder?.customer?.companyName ||
    invoiceData.invoice.clientNameSnapshot ||
    invoiceData.invoice.salesOrder?.clientNameSnapshot ||
    invoiceData.invoice.salesOrder?.receivedFromName ||
    null;
  const addressLine1 = invoiceData.invoice.salesOrder?.customer?.addressLine1 ?? null;
  const addressLine2 = invoiceData.invoice.salesOrder?.customer?.addressLine2 ?? null;
  const city =
    invoiceData.invoice.citySnapshot ||
    invoiceData.invoice.salesOrder?.citySnapshot ||
    invoiceData.invoice.salesOrder?.customer?.city ||
    null;
  const state =
    invoiceData.invoice.stateSnapshot ||
    invoiceData.invoice.salesOrder?.stateSnapshot ||
    invoiceData.invoice.salesOrder?.customer?.state ||
    null;
  const country = invoiceData.invoice.salesOrder?.customer?.country ?? null;
  const pincode = invoiceData.invoice.salesOrder?.customer?.pincode ?? null;
  const gstin =
    invoiceData.invoice.gstinSnapshot ||
    invoiceData.invoice.salesOrder?.gstinSnapshot ||
    invoiceData.invoice.salesOrder?.customer?.gstin ||
    null;

  return (
    <div
      className={`${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      <InvoiceTestCertificateCopy
        invoice={{
          invoiceNo: invoiceData.invoice.invoiceNo,
          invoiceFy: invoiceData.invoice.invoiceFy,
          invoiceDate: invoiceData.invoice.invoiceDate,
          poNumber,
          poDate,
          companyName,
          addressLine1,
          addressLine2,
          city,
          state,
          country,
          pincode,
          gstin,
        }}
        items={selectedItems.map((item) => ({
          id: item.id,
          title: item.title,
          sku: item.sku,
          typeNumber: item.typeNumber,
          hsnCode: item.hsnCode,
          unit: item.unit,
          invoiceQty: Number(item.invoiceQty ?? 0),
          cimfrNumber: item.cimfrNumber,
          serialNumber: item.serialNumber,
        }))}
      />
    </div>
  );
};

export default page;
