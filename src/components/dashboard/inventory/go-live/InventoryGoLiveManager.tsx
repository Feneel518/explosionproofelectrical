"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveInventoryGoLiveAction } from "@/lib/actions/dashboard/inventory/go-live/inventoryGoLiveActions";

type Material = {
  id: string;
  itemCode: string | null;
  companyItemName: string;
  unit: string;
  openingStockQty: number;
  openingStockAt: string | null;
  inventoryActivatedAt: string | null;
  inventoryActivationSource: "OPENING_COUNT" | "POST_GO_LIVE_GRN" | null;
  qtyOnHand: number;
};

export default function InventoryGoLiveManager({
  goLiveDate,
  physicalCountDate,
  materials,
}: {
  goLiveDate: string;
  physicalCountDate: string;
  materials: Material[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const active = materials.filter((row) => row.inventoryActivatedAt).length;

  async function save(formData: FormData) {
    setPending(true);
    const result = await saveInventoryGoLiveAction(formData);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form action={save} className="grid gap-4 rounded-xl border p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div><label className="mb-1 block text-sm font-medium">Physical Stock Count Date</label><Input type="date" name="physicalStockCountAt" required defaultValue={physicalCountDate} /></div>
        <div><label className="mb-1 block text-sm font-medium">Inventory Go-Live Date</label><Input type="date" name="inventoryGoLiveDate" required defaultValue={goLiveDate} /></div>
        <Button disabled={pending}>{pending ? "Saving..." : "Save Dates"}</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Active Raw Materials</p><p className="text-2xl font-semibold">{active}</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Pending Physical Count</p><p className="text-2xl font-semibold">{materials.length - active}</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Total Raw Materials</p><p className="text-2xl font-semibold">{materials.length}</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[110px_1fr_130px_160px] gap-3 border-b bg-muted/40 px-4 py-3 text-sm font-medium"><span>Code</span><span>Raw Material</span><span>Opening Qty</span><span>Status</span></div>
        {materials.map((row) => (
          <div key={row.id} className="grid grid-cols-[110px_1fr_130px_160px] items-center gap-3 border-b px-4 py-3 text-sm last:border-0">
            <span>{row.itemCode ?? "—"}</span>
            <span><Link className="font-medium hover:underline" href={`/dashboard/raw-materials/${row.id}`}>{row.companyItemName}</Link><span className="block text-xs text-muted-foreground">Current: {row.qtyOnHand} {row.unit}</span></span>
            <span>{row.openingStockQty} {row.unit}</span>
            <span>{row.inventoryActivatedAt ? <Badge>Inventory Active</Badge> : <Button asChild size="sm" variant="outline"><Link href={`/dashboard/raw-materials/${row.id}`}>Enter Count</Link></Button>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
