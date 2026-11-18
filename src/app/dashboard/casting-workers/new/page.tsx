import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import WorkerForm from "@/components/dashboard/contractors/WorkerForm";

export default async function Page() {
  await requirePermission("production.write");
  return <WorkerForm mode="create" workerKind="CASTING" />;
}
