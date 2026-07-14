"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveModal } from "@/components/dashboard/global/ResponsiveModal";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";

interface WorkOrderCopyItem {
  id: string;
  productName?: string | null;
  itemName?: string | null;
  description?: string | null;
  qty?: number | string | null;
  unit?: string | null;
  price: number | null;
}

interface WorkOrderCopyModalProps {
  orderId: string;
  items: WorkOrderCopyItem[];
}

const WorkOrderCopyModal: FC<WorkOrderCopyModalProps> = ({
  orderId,
  items,
}) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedIds(items.map((item) => item.id));
    }
  }, [open, items]);

  const allSelected = useMemo(() => {
    return items.length > 0 && selectedIds.length === items.length;
  }, [items.length, selectedIds.length]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  };

  const handleGenerate = () => {
    if (selectedIds.length === 0) return;

    const params = new URLSearchParams({
      items: selectedIds.join(","),
    });

    router.push(`/sales-orders/${orderId}/work-order?${params.toString()}`);
    setOpen(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Work Order Copy
        </Button>
      }
      title="Generate Work Order Copy"
      description="Select the items you want to include in the work order copy."
      dialogClassName="max-w-3xl"
      drawerClassName="max-h-[92vh]"
      scrollClassName="max-h-[70vh]">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border px-4 py-3">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
            />
            <div>
              <p className="text-sm font-medium">Select All</p>
              <p className="text-xs text-muted-foreground">
                {selectedIds.length} of {items.length} items selected
              </p>
            </div>
          </label>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={selectedIds.length === 0}>
            Generate Copy
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="divide-y">
            {items.map((item, index) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 px-4 py-4 hover:bg-muted/40">
                <Checkbox
                  checked={isSelected(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      Item {index + 1} - {item.productName} -{" "}
                      {item.itemName ?? index + 1}
                    </p>

                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Qty: {item.qty ?? 0} {item.unit ?? ""}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description || "No description"} -{" "}
                    {formatCurrencyINR(item.price ?? 0)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default WorkOrderCopyModal;
