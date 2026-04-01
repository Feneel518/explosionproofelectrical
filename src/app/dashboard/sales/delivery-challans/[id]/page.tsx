import DeliveryChallanDetailView from "@/components/dashboard/sales/delivery-challan/DeliveryChallanDetailView";
import { getDeliveryChallanByIdAction } from "@/lib/actions/dashboard/sales/delivery-challan/getDeliveryChallanByIdAction";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getDeliveryChallanByIdAction(id);

  if (!res.ok) {
    return <div className="p-6">{res.message}</div>;
  }

  return (
    <div className="p-6">
      <DeliveryChallanDetailView deliveryChallan={res.deliveryChallan} />
    </div>
  );
}
