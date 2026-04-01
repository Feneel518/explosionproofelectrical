import { redirect } from "next/navigation";

import { createDraftMaterialIssueAction } from "@/lib/actions/dashboard/manufacturing/material-issue/createDraftMaterialIssueAction";

export const dynamic = "force-dynamic";

export default async function Page() {
  const res = await createDraftMaterialIssueAction();
  if (!res.ok) redirect("/dashboard/manufacturing/material-issues");
  redirect(`/dashboard/manufacturing/material-issues/${res.id}/edit`);
}
