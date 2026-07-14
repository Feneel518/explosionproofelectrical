import MaterialIssueDetailView from "@/components/dashboard/manufacturing/material-issue/MaterialIssueDetailView";
import { getMaterialIssueByIdAction } from "@/lib/actions/dashboard/manufacturing/material-issue/getMaterialIssueByIdAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getMaterialIssueByIdAction(id);

  if (!res.ok) {
    return <div className="p-6 text-sm text-muted-foreground">{res.message}</div>;
  }

  return <MaterialIssueDetailView issue={res.materialIssue} />;
}
