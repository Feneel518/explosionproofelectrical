"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adjustRawMaterialStockAction } from "@/lib/actions/dashboard/raw-materials/adjustRawMaterialStock";
import { setRawMaterialOpeningStockAction } from "@/lib/actions/dashboard/raw-materials/setRawMaterialOpeningStock";

type QuickMovementType =
  | "ADJUST_IN"
  | "ADJUST_OUT"
  | "SCRAP_OUT"
  | "RETURN_IN"
  | "RETURN_OUT";

const QUICK_MOVEMENT_OPTIONS: Array<{ value: QuickMovementType; label: string }> = [
  { value: "SCRAP_OUT", label: "Rejection / Scrap Out (-)" },
  { value: "ADJUST_OUT", label: "Adjust Out (-)" },
  { value: "ADJUST_IN", label: "Adjust In (+)" },
  { value: "RETURN_IN", label: "Return In (+)" },
  { value: "RETURN_OUT", label: "Return Out (-)" },
];

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
  const [isOpeningPending, startOpening] = React.useTransition();
  const [isAdjustPending, startAdjust] = React.useTransition();

  const [qty, setQty] = React.useState<number>(
    Number.isFinite(openingStockQty) ? openingStockQty : currentOnHand,
  );
  const [unitCost, setUnitCost] = React.useState<string>(
    openingStockUnitCost == null ? "" : String(openingStockUnitCost),
  );
  const [asOnDate, setAsOnDate] = React.useState<string>(
    toDateInput(openingStockAt) || toDateInput(new Date()),
  );
  const [adjustMovementType, setAdjustMovementType] =
    React.useState<QuickMovementType>("SCRAP_OUT");
  const [adjustQty, setAdjustQty] = React.useState<number>(1);
  const [adjustReason, setAdjustReason] = React.useState<string>("Rejection");
  const [adjustRemarks, setAdjustRemarks] = React.useState<string>("");
  const [adjustDate, setAdjustDate] = React.useState<string>(toDateInput(new Date()));

  const onSubmit = () => {
    startOpening(async () => {
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

  const onAdjustStock = () => {
    startAdjust(async () => {
      const res = await adjustRawMaterialStockAction({
        rawMaterialId,
        movementType: adjustMovementType,
        qty: adjustQty,
        reason: adjustReason,
        remarks: adjustRemarks,
        movementAt: adjustDate || null,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setAdjustQty(1);
      setAdjustRemarks("");
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
            step="0.001"
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
        <Button type="button" onClick={onSubmit} disabled={isOpeningPending}>
          {isOpeningPending ? "Saving..." : "Set Opening Stock"}
        </Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold">Quick Stock Adjustment</h3>
          <p className="text-xs text-muted-foreground">
            Use this for rejection, scrap, count correction, and manual returns.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm">Adjustment Type</label>
            <Select
              value={adjustMovementType}
              onValueChange={(value) =>
                setAdjustMovementType((value as QuickMovementType) || "SCRAP_OUT")
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select adjustment type" />
              </SelectTrigger>
              <SelectContent>
                {QUICK_MOVEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm">Quantity</label>
              <Input
                type="number"
                min={0.001}
                step="0.001"
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(0.001, Number(e.target.value || 0)))}
              />
          </div>

          <div>
            <label className="text-sm">Reason</label>
            <Input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Rejection / Damage / Count correction"
            />
          </div>

          <div>
            <label className="text-sm">Adjustment Date</label>
            <Input
              type="date"
              value={adjustDate}
              onChange={(e) => setAdjustDate(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm">Remarks (Optional)</label>
            <Textarea
              value={adjustRemarks}
              onChange={(e) => setAdjustRemarks(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onAdjustStock} disabled={isAdjustPending}>
            {isAdjustPending ? "Posting..." : "Post Adjustment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
