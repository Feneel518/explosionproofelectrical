"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";

import { closeDeliveryChallanAction } from "@/lib/actions/dashboard/sales/delivery-challan/closeDeliveryChallanAction";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "../../global/ResponsiveModal";

type ChallanItem = {
  id: string;
  title: string;
  qty: number;
  closedQty: number;
  pendingQty: number;
};

interface CloseDeliveryChallanDialogProps {
  challanId: string;
  status: string;
  items: ChallanItem[];
}

export default function CloseDeliveryChallanDialog({
  challanId,
  status,
  items,
}: CloseDeliveryChallanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [remarks, setRemarks] = React.useState("");

  const [rows, setRows] = React.useState(
    items.map((item) => ({
      id: item.id,
      title: item.title,
      qty: Number(item.qty || 0),
      closedQty:
        Number(item.pendingQty || 0) > 0
          ? Number(item.qty || 0)
          : Number(item.closedQty || 0),
    })),
  );

  React.useEffect(() => {
    if (!open) return;

    setRows(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        qty: Number(item.qty || 0),
        closedQty:
          Number(item.pendingQty || 0) > 0
            ? Number(item.qty || 0)
            : Number(item.closedQty || 0),
      })),
    );
  }, [items, open]);

  if (status === "CLOSED" || status === "CANCELLED") return null;

  const handleQtyChange = (id: string, qty: number) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              closedQty: Math.max(0, Math.min(qty, row.qty)),
            }
          : row,
      ),
    );
  };

  const handleSubmit = async () => {
    try {
      setPending(true);

      const res = await closeDeliveryChallanAction(
        challanId,
        rows.map((row) => ({
          id: row.id,
          closedQty: Number(row.closedQty || 0),
        })),
        remarks,
      );

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setOpen(false);
      setRemarks("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <div className="focus:bg-primary hover:bg-primary hover:text-white cursor-pointer focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          Close Challan
        </div>
      }
      title="Close Delivery Challan"
      description="Add closure notes and confirm how this challan is being closed."
      dialogClassName="max-w-3xl"
      drawerClassName="max-h-[95vh]"
      scrollClassName="space-y-5">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="text-sm font-medium">Closure Notes</div>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Example: Material received back from vendor and verified in good condition."
            rows={5}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Item-wise Closing Qty</div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-12 md:items-end">
                <div className="md:col-span-6">
                  <div className="text-sm font-medium">{row.title}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Total Qty
                  </div>
                  <div className="font-medium">{row.qty}</div>
                </div>

                <div className="md:col-span-4">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Closing Qty
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={row.qty}
                    value={row.closedQty}
                    onChange={(e) =>
                      handleQtyChange(row.id, Number(e.target.value || 0))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}>
            Cancel
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? "Closing..." : "Confirm Close"}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
