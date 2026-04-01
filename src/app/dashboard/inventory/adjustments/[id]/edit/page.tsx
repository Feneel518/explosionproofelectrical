import { redirect } from "next/navigation";

import StockAdjustmentForm from "@/components/dashboard/inventory/stock-adjustment/StockAdjustmentForm";
import { getStockAdjustmentDraftAction } from "@/lib/actions/dashboard/inventory/stock-adjustment/getStockAdjustmentDraftAction";
import { StockAdjustmentDraftData } from "@/lib/actions/dashboard/inventory/stock-adjustment/createDraftStockAdjustmentAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getStockAdjustmentDraftAction(id);

  if (!res.ok) redirect("/dashboard/inventory/adjustments");

  return (
    <StockAdjustmentForm
      stockAdjustmentId={res.stockAdjustmentId}
      adjustNo={res.adjustNo}
      adjustFy={res.adjustFy}
      initialDraft={res.draft as StockAdjustmentDraftData}
      initialDraftVersion={res.draftVersion}
    />
  );
}
