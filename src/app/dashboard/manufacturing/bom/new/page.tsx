import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import BomForm from "@/components/dashboard/manufacturing/bom/BomForm";

export default async function Page() {
  await requirePermission("production.write");
  return <BomForm mode="create" />;
}
