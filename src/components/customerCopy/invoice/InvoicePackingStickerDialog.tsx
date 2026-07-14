"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveModal } from "@/components/dashboard/global/ResponsiveModal";

type PackingPackage = {
  id: string;
  packageNo?: string | null;
  packageType?: string | null;
  label?: string | null;
  remarks?: string | null;
  grossWeight?: number | null;
  netWeight?: number | null;
  items: {
    id: string;
    qty: number;
    title?: string | null;
    sku?: string | null;
    typeNumber?: string | null;
  }[];
};

interface InvoicePackingStickerDialogProps {
  invoiceId: string;
  packages: PackingPackage[];
}

const InvoicePackingStickerDialog: FC<InvoicePackingStickerDialogProps> = ({
  invoiceId,
  packages,
}) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    setSelectedIds(packages.map((pkg) => pkg.id));
  }, [open, packages]);

  const allSelected = useMemo(() => {
    return packages.length > 0 && selectedIds.length === packages.length;
  }, [packages.length, selectedIds.length]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const togglePackage = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pkgId) => pkgId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? packages.map((pkg) => pkg.id) : []);
  };

  const handleGenerate = () => {
    if (selectedIds.length === 0) return;

    const params = new URLSearchParams({
      packages: selectedIds.join(","),
    });

    router.push(`/invoices/${invoiceId}/packing-stickers?${params.toString()}`);
    setOpen(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="outline" disabled={packages.length === 0}>
          <Package className="mr-2 h-4 w-4" />
          Packing Stickers
        </Button>
      }
      title="Generate Packing Stickers"
      description="Select package rows created during invoice packaging."
      dialogClassName="max-w-4xl"
      drawerClassName="max-h-[92vh]"
      scrollClassName="max-h-[70vh]">
      <div className="space-y-4">
        {packages.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No packages found in this invoice. Create packaging first in invoice edit.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                />
                <div>
                  <p className="text-sm font-medium">Select All</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedIds.length} of {packages.length} packages selected
                  </p>
                </div>
              </label>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={selectedIds.length === 0}>
                Generate Stickers
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="divide-y">
                {packages.map((pkg, index) => {
                  const totalQty = (pkg.items ?? []).reduce(
                    (acc, item) => acc + Number(item.qty ?? 0),
                    0,
                  );

                  return (
                    <label
                      key={pkg.id}
                      className="flex cursor-pointer items-start gap-3 px-4 py-4 hover:bg-muted/40">
                      <Checkbox
                        checked={isSelected(pkg.id)}
                        onCheckedChange={() => togglePackage(pkg.id)}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            Package {pkg.packageNo || index + 1}
                          </p>
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Qty: {totalQty}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {[pkg.packageType, pkg.label].filter(Boolean).join(" - ") || "-"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {(pkg.items ?? [])
                            .map((item) => `${item.qty} x ${item.title || "Item"}`)
                            .join(" | ") || "No items"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default InvoicePackingStickerDialog;