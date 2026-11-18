import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import GrnDetailView from "@/components/dashboard/purchase/grn/GrnDetailView";
import { getGrnByIdAction } from "@/lib/actions/dashboard/purchase/grn/getGrnByIdAction";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  await requirePermission("inventory.read");
  const { id } = await params;
  const res = await getGrnByIdAction(id);

  if (!res.ok) {
    return <div className="p-6 text-sm text-muted-foreground">{res.message}</div>;
  }

  return <GrnDetailView grn={res.grn} />;
}
