import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import { redirect } from "next/navigation";

import { createDraftGrnAction } from "@/lib/actions/dashboard/purchase/grn/createDraftGrnAction";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requirePermission("inventory.write");
  const res = await createDraftGrnAction();
  if (!res.ok) redirect("/dashboard/purchase/grn");
  redirect(`/dashboard/purchase/grn/${res.id}/edit`);
}
