import { redirect } from "next/navigation";
import { FC } from "react";

import { createDraftInvoiceAction } from "@/lib/actions/dashboard/sales/invoice/createDraftInvoiceAction";
import CreateInvoiceLauncher from "@/components/dashboard/sales/invoice/CreateInvoiceLauncher";

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

const page: FC<PageProps> = async ({ searchParams }) => {
  const sp = await searchParams;
  const orderId = sp.orderId?.trim();

  if (orderId) {
    const res = await createDraftInvoiceAction(orderId);

    if (res.ok) {
      redirect(`/dashboard/sales/invoices/${res.id}/edit`);
    }
  }

  return <CreateInvoiceLauncher initialOrderId={orderId ?? null} />;
};

export default page;
