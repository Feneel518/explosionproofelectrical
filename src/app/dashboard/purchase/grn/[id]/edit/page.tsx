import { redirect } from "next/navigation";

import GrnForm from "@/components/dashboard/purchase/grn/GrnForm";
import { getGrnDraftAction } from "@/lib/actions/dashboard/purchase/grn/getGrnDraftAction";
import { GrnDraftData } from "@/lib/actions/dashboard/purchase/grn/createDraftGrnAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getGrnDraftAction(id);

  if (!res.ok) redirect("/dashboard/purchase/grn");

  return (
    <GrnForm
      grnId={res.grnId}
      grnNo={res.grnNo}
      grnFy={res.grnFy}
      isFinalized={res.status === "FINALIZED"}
      initialDraft={res.draft as GrnDraftData}
      initialDraftVersion={res.draftVersion}
    />
  );
}
