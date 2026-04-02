"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { ProductVariantCombobox } from "@/components/dashboard/global/ProductVariantCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  initialQ: string;
  initialOnlyShortage: boolean;
  initialVariantId: string | null;
};

export default function ProductionPlanningFilters({
  initialQ,
  initialOnlyShortage,
  initialVariantId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = React.useState(initialQ);
  const [onlyShortage, setOnlyShortage] = React.useState(
    initialOnlyShortage ? "1" : "0",
  );
  const [variantId, setVariantId] = React.useState<string | null>(
    initialVariantId,
  );

  const applyFilters = React.useCallback(() => {
    const params = new URLSearchParams();
    const query = q.trim();

    if (query) params.set("q", query);
    if (onlyShortage === "1") params.set("onlyShortage", "1");
    if (variantId) params.set("variantId", variantId);

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(href);
  }, [pathname, q, onlyShortage, variantId, router]);

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Search Product/Variant</label>
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Wellglass, SKU, type number..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Product Variant</label>
          <ProductVariantCombobox
            value={variantId}
            onChange={(item) => setVariantId(item?.id ?? null)}
            placeholder="Filter by exact variant"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Only Shortage</label>
          <Select value={onlyShortage} onValueChange={setOnlyShortage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Show all components</SelectItem>
              <SelectItem value="1">Show only shortage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="button" onClick={applyFilters}>
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQ("");
              setOnlyShortage("0");
              setVariantId(null);
              router.push(pathname);
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
