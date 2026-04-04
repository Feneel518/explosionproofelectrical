"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { FileCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveModal } from "@/components/dashboard/global/ResponsiveModal";

type TestCertificateItem = {
  id: string;
  title: string;
  sku?: string | null;
  typeNumber?: string | null;
  qty: number;
  unit?: string | null;
};

interface InvoiceTestCertificateDialogProps {
  invoiceId: string;
  items: TestCertificateItem[];
}

const InvoiceTestCertificateDialog: FC<InvoiceTestCertificateDialogProps> = ({
  invoiceId,
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
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
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

    router.push(`/invoices/${invoiceId}/test-certificate?${params.toString()}`);
    setOpen(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="outline">
          <FileCheck className="mr-2 h-4 w-4" />
          Test Certificate
        </Button>
      }
      title="Generate Test Certificate"
      description="Select items for which the test certificates should be created."
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
            Generate Certificates
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
                      Item {index + 1} - {item.title}
                    </p>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Qty: {item.qty} {item.unit ?? ""}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {[item.sku, item.typeNumber].filter(Boolean).join(" â€¢ ") || "â€”"}
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

export default InvoiceTestCertificateDialog;

