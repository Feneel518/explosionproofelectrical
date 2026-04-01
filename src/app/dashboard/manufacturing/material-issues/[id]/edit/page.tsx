import { redirect } from "next/navigation";

import MaterialIssueForm from "@/components/dashboard/manufacturing/material-issue/MaterialIssueForm";
import { getMaterialIssueDraftAction } from "@/lib/actions/dashboard/manufacturing/material-issue/getMaterialIssueDraftAction";
import { MaterialIssueDraftData } from "@/lib/actions/dashboard/manufacturing/material-issue/createDraftMaterialIssueAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getMaterialIssueDraftAction(id);

  if (!res.ok) redirect("/dashboard/manufacturing/material-issues");

  return (
    <MaterialIssueForm
      materialIssueId={res.materialIssueId}
      issueNo={res.issueNo}
      issueFy={res.issueFy}
      initialDraft={res.draft as MaterialIssueDraftData}
      initialDraftVersion={res.draftVersion}
    />
  );
}
