import InvoiceCustomerCopy from "@/components/customerCopy/invoice/InvoiceCustomerCopy";
import { getInvoiceByIdAction } from "@/lib/actions/dashboard/sales/invoice/getInvoiceById";
import { requireAuth } from "@/lib/check/requireAuth";

import { Lora } from "next/font/google";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const page: FC<PageProps> = async ({ params }) => {
  await requireAuth();
  const { id } = await params;

  const invoiceData = await getInvoiceByIdAction(id);

  if (!invoiceData.ok) {
    redirect("/dashboard/sales/invoices");
  }

  const invoice = invoiceData.invoice;
  const copyInvoice = {
    ...invoice,
    companyNameSnapshot: invoice.salesOrder?.customer?.companyName || "—",
    clientNameSnapshot:
      invoice.clientNameSnapshot ||
      invoice.salesOrder?.clientNameSnapshot ||
      invoice.salesOrder?.customer?.companyName ||
      invoice.salesOrder?.receivedFromName ||
      null,
    citySnapshot:
      invoice.citySnapshot ||
      invoice.salesOrder?.citySnapshot ||
      invoice.salesOrder?.customer?.city ||
      null,
    stateSnapshot:
      invoice.stateSnapshot ||
      invoice.salesOrder?.stateSnapshot ||
      invoice.salesOrder?.customer?.state ||
      null,
    gstinSnapshot:
      invoice.gstinSnapshot ||
      invoice.salesOrder?.gstinSnapshot ||
      invoice.salesOrder?.customer?.gstin ||
      null,
    addressLine1: invoice.salesOrder?.customer?.addressLine1 || null,
    addressLine2: invoice.salesOrder?.customer?.addressLine2 || null,
    countrySnapshot: invoice.salesOrder?.customer?.country || null,
    pincodeSnapshot: invoice.salesOrder?.customer?.pincode || null,
    contactNameSnapshot: invoice.salesOrder?.receivedFromName || null,
    contactPhoneSnapshot:
      invoice.salesOrder?.receivedFromPhone ||
      invoice.salesOrder?.customer?.companyPhone ||
      null,
    contactEmailSnapshot:
      invoice.salesOrder?.receivedFromEmail ||
      invoice.salesOrder?.customer?.companyEmail ||
      null,
    poNumber: invoice.poNumber || invoice.salesOrder?.poNumber || null,
    poDate: invoice.poDate || invoice.salesOrder?.poDate || null,
  };

  return (
    <div
      className={`${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      <InvoiceCustomerCopy invoice={copyInvoice} />
    </div>
  );
};

export default page;
