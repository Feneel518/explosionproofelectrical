import QuotationDetailView from "@/components/dashboard/sales/quotation/QuotationDetailView";
import { GmailLinkedMessages } from "@/components/dashboard/gmail/GmailLinkedMessages";
import { getQuotationByIdAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationByIdAction";

export const maxDuration = 120;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getQuotationByIdAction(id);

  if (!res.ok) {
    return <div className="p-6">{res.message}</div>;
  }

  return (
    <div className="p-6">
      <QuotationDetailView quotation={res.quotation} />
      <GmailLinkedMessages kind="QUOTATION" recordId={id} />
    </div>
  );
}
