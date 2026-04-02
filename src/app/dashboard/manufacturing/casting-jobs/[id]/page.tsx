import CastingJobDetailView from "@/components/dashboard/manufacturing/casting-job/CastingJobDetailView";
import { getCastingJobByIdAction } from "@/lib/actions/dashboard/manufacturing/casting-job/getCastingJobByIdAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getCastingJobByIdAction(id);

  if (!res.ok) {
    return <div className="p-6 text-sm text-muted-foreground">{res.message}</div>;
  }

  return <CastingJobDetailView castingJob={res.castingJob} />;
}

