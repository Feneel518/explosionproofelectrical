import StockAdjustmentDetailView from "@/components/dashboard/inventory/stock-adjustment/StockAdjustmentDetailView";
import { getStockAdjustmentByIdAction } from "@/lib/actions/dashboard/inventory/stock-adjustment/getStockAdjustmentByIdAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getStockAdjustmentByIdAction(id);

  if (!res.ok) {
    return <div className="p-6 text-sm text-muted-foreground">{res.message}</div>;
  }

  return <StockAdjustmentDetailView adjustment={res.stockAdjustment} />;
}
