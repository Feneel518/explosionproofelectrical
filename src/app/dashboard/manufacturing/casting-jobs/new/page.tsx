import { redirect } from "next/navigation";

import { createDraftCastingJobAction } from "@/lib/actions/dashboard/manufacturing/casting-job/createDraftCastingJobAction";

export const dynamic = "force-dynamic";

export default async function Page() {
  const res = await createDraftCastingJobAction();
  if (!res.ok) redirect("/dashboard/manufacturing/casting-jobs");
  redirect(`/dashboard/manufacturing/casting-jobs/${res.id}/edit`);
}

