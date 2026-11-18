import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import PurchaseOrderForm from "@/components/dashboard/purchase/order/PurchaseOrderForm";
export default async function NewPurchaseOrderPage() {
  await requirePermission("purchase.write"); return <PurchaseOrderForm/>; }
