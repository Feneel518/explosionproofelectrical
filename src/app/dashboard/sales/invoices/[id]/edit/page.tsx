import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import InvoiceEditForm from "@/components/dashboard/sales/invoice/form/InvoiceEditForm";
import { getInvoiceEditDataAction } from "@/lib/actions/dashboard/sales/invoice/getInvoiceEditDataAction";
import { notFound, redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<PageProps> = async ({ params }) => {
  await requirePermission("accounts.write");
  const { id } = await params;

  const res = await getInvoiceEditDataAction(id);

  if (!res.ok || !res.invoice) {
    notFound();
  }

  if (res.invoice.status !== "DRAFT") {
    redirect(`/dashboard/sales/invoices/${id}`);
  }

  return <InvoiceEditForm invoice={res.invoice} />;
};

export default page;
