"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setRawMaterialOpeningStockAction } from "@/lib/actions/dashboard/raw-materials/setRawMaterialOpeningStock";

function toDateInput(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function RawMaterialOpeningStockCard({
  rawMaterialId,
  itemName,
  currentOnHand,
  openingStockQty,
  openingStockUnitCost,
  openingStockAt,
}: {
  rawMaterialId: string;
  itemName: string;
  currentOnHand: number;
  openingStockQty: number;
  openingStockUnitCost: number | null;
  openingStockAt: string | Date | null;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const [qty, setQty] = React.useState<number>(
    Number.isFinite(openingStockQty) ? openingStockQty : currentOnHand,
  );
  const [unitCost, setUnitCost] = React.useState<string>(
    openingStockUnitCost == null ? "" : String(openingStockUnitCost),
  );
  const [asOnDate, setAsOnDate] = React.useState<string>(
    toDateInput(openingStockAt) || toDateInput(new Date()),
  );

  const onSubmit = () => {
    start(async () => {
      const res = await setRawMaterialOpeningStockAction({
        rawMaterialId,
        openingQty: qty,
        openingUnitCost: unitCost === "" ? null : Number(unitCost),
        openingAt: asOnDate || null,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Opening Stock</h2>
        <p className="text-sm text-muted-foreground">
          Set opening stock for {itemName}. Current on-hand: {currentOnHand}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-sm">Opening Qty</label>
          <Input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(Math.max(0, Number(e.target.value || 0)))}
          />
        </div>

        <div>
          <label className="text-sm">Opening Unit Cost</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="text-sm">As On Date</label>
          <Input
            type="date"
            value={asOnDate}
            onChange={(e) => setAsOnDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? "Saving..." : "Set Opening Stock"}
        </Button>
      </div>
    </div>
  );
}
