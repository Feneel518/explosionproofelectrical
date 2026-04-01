import InvoicePackingStickerCopy from "@/components/customerCopy/invoice/InvoicePackingStickerCopy";
import { getInvoiceByIdAction } from "@/lib/actions/dashboard/sales/invoice/getInvoiceById";
import { requireAuth } from "@/lib/check/requireAuth";
import { Lora } from "next/font/google";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ packages?: string }>;
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
  const { packages } = await searchParams;

  const invoiceData = await getInvoiceByIdAction(id);

  if (!invoiceData.ok) {
    redirect("/dashboard/sales/invoices");
  }

  const invoice = invoiceData.invoice;
  const selectedIds = parseSelectedIds(packages);

  const allPackages = Array.isArray(invoice.packages) ? invoice.packages : [];
  const selectedPackages =
    selectedIds.length > 0
      ? allPackages.filter((pkg) => selectedIds.includes(pkg.id))
      : allPackages;

  const stickers = selectedPackages.map((pkg) => ({
    id: pkg.id,
    packageNo: pkg.packageNo || "-",
    packageType: pkg.packageType,
    label: pkg.label,
    remarks: pkg.remarks,
    grossWeight: pkg.grossWeight,
    netWeight: pkg.netWeight,
    itemLines: (pkg.items ?? []).map(
      (pkgItem) => `${pkgItem.qty} x ${pkgItem.title || "Item"}`,
    ),
  }));

  const clientName =
    invoice.clientNameSnapshot ||
    invoice.salesOrder?.clientNameSnapshot ||
    invoice.salesOrder?.customer?.companyName ||
    invoice.salesOrder?.receivedFromName ||
    null;

  return (
    <div
      className={`${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      <InvoicePackingStickerCopy
        invoice={{
          invoiceNo: invoice.invoiceNo,
          invoiceFy: invoice.invoiceFy,
          clientName,
          dispatchDate: invoice.dispatchDate,
        }}
        stickers={stickers}
      />
    </div>
  );
};

export default page;