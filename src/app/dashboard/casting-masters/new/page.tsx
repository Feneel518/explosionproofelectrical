import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import CastingMasterForm from "@/components/dashboard/casting-master/CastingMasterForm";

export default async function Page() {
  await requirePermission("master.write");
  return <CastingMasterForm mode="create" />;
}
