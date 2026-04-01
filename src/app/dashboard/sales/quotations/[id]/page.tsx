import QuotationDetailView from "@/components/dashboard/sales/quotation/QuotationDetailView";
import { getQuotationByIdAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationByIdAction";

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
    </div>
  );
}
