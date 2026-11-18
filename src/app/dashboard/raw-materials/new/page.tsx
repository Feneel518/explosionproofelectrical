import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import RawMaterialForm from "@/components/dashboard/raw-material/RawMaterialForm";

export default async function Page() {
  await requirePermission("master.write");
  return <RawMaterialForm mode="create" />;
}
