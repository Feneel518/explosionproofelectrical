import QuotationFormNew from "@/components/dashboard/sales/quotation/QuotationFormNew";
import { listCustomersForSelect } from "@/lib/actions/dashboard/global/listCustomersForSelect";
import { getQuotationDraftAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationDraftAction";
import { prisma } from "@/lib/prisma/db";
import { QuotationDraftData } from "@/lib/types/QuotationType";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;
  const res = await getQuotationDraftAction(id);

  if (!res.ok) redirect("/dashboard/sales/quotations");

  const customers = await listCustomersForSelect();

  return (
    <div>
      <QuotationFormNew
        quotationId={res.quotationId}
        quoteFY={res.quoteFY}
        quoteNo={res.quoteNo}
        initialDraft={res.draft as QuotationDraftData}
        initialDraftVersion={res.draftVersion}
        customers={customers}></QuotationFormNew>
    </div>
  );
};

export default page;
