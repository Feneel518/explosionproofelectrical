import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import { redirect } from "next/navigation";

export default async function Page() {
  await requirePermission("sales.read");
  redirect("/dashboard/sales/pending");
}
