import { redirect } from "next/navigation";

import { createDraftStockAdjustmentAction } from "@/lib/actions/dashboard/inventory/stock-adjustment/createDraftStockAdjustmentAction";

export const dynamic = "force-dynamic";

export default async function Page() {
  const res = await createDraftStockAdjustmentAction();
  if (!res.ok) redirect("/dashboard/inventory/adjustments");
  redirect(`/dashboard/inventory/adjustments/${res.id}/edit`);
}
