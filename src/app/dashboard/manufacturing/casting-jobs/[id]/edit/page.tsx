import { redirect } from "next/navigation";

import CastingJobForm from "@/components/dashboard/manufacturing/casting-job/CastingJobForm";
import { CastingJobDraftData } from "@/lib/actions/dashboard/manufacturing/casting-job/createDraftCastingJobAction";
import { getCastingJobDraftAction } from "@/lib/actions/dashboard/manufacturing/casting-job/getCastingJobDraftAction";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getCastingJobDraftAction(id);

  if (!res.ok) redirect("/dashboard/manufacturing/casting-jobs");

  const workers = await prisma.worker.findMany({
    where: { status: "ACTIVE", kind: "CASTING", deletedAt: null },
    orderBy: [{ name: "asc" }, { code: "asc" }],
    select: { id: true, name: true, code: true, role: true },
  });

  return (
    <CastingJobForm
      castingJobId={res.castingJobId}
      jobNo={res.jobNo}
      jobFy={res.jobFy}
      initialDraft={res.draft as CastingJobDraftData}
      initialDraftVersion={res.draftVersion}
      workers={workers}
    />
  );
}
