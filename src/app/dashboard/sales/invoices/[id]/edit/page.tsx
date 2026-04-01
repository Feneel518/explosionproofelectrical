import InvoiceEditForm from "@/components/dashboard/sales/invoice/form/InvoiceEditForm";
import { getInvoiceEditDataAction } from "@/lib/actions/dashboard/sales/invoice/getInvoiceEditDataAction";
import { notFound } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;

  const res = await getInvoiceEditDataAction(id);

  if (!res.ok || !res.invoice) {
    notFound();
  }

  return <InvoiceEditForm invoice={res.invoice} />;
};

export default page;
