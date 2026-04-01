import InvoiceDetailView from "@/components/dashboard/sales/invoice/InvoiceDetailView";
import { getInvoiceByIdAction } from "@/lib/actions/dashboard/sales/invoice/getInvoiceById";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getInvoiceByIdAction(id);

  if (!res.ok) {
    return <div className="p-6">{res.message}</div>;
  }

  return (
    <div className="p-6">
      <InvoiceDetailView invoice={res.invoice} />
    </div>
  );
}
