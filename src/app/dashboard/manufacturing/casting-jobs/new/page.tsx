import { redirect } from "next/navigation";

import { createDraftCastingJobAction } from "@/lib/actions/dashboard/manufacturing/casting-job/createDraftCastingJobAction";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ workerId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { workerId } = await searchParams;
  const res = await createDraftCastingJobAction(workerId);
  if (!res.ok) redirect("/dashboard/manufacturing/casting-jobs");
  redirect(`/dashboard/manufacturing/casting-jobs/${res.id}/edit`);
}
