"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvailableProductSerialsAction } from "@/lib/actions/dashboard/serial/getAvailableProductSerialsAction";

type SerialOption = { id: string; serialNumber: string; year: number; sequence: number };

type Props = {
  productId: string | null | undefined;
  quantity: number;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function ProductSerialSelector({ productId, quantity, value, onChange, disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [trackingEnabled, setTrackingEnabled] = React.useState<boolean | null>(null);
  const [productName, setProductName] = React.useState("");
  const [options, setOptions] = React.useState<SerialOption[]>([]);
  const [pending, setPending] = React.useState<string[]>(value ?? []);
  const [search, setSearch] = React.useState("");
  const safeQty = Math.max(0, Math.trunc(Number(quantity || 0)));

  React.useEffect(() => {
    if (!open || !productId) return;
    let cancelled = false;
    setLoading(true);
    setPending(value ?? []);
    getAvailableProductSerialsAction(productId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setTrackingEnabled(null);
          setOptions([]);
          return;
        }
        setProductName(result.productName);
        setTrackingEnabled(result.trackingEnabled);
        setOptions(result.serials);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, productId, value]);

  const optionById = new Map(options.map((option) => [option.id, option]));
  const selectedLabels = (value ?? []).map((id) => optionById.get(id)?.serialNumber).filter(Boolean);
  const filtered = options.filter((option) => option.serialNumber.toLowerCase().includes(search.trim().toLowerCase()));

  function toggle(id: string, checked: boolean) {
    setPending((current) => {
      if (!checked) return current.filter((row) => row !== id);
      if (current.includes(id) || current.length >= safeQty) return current;
      return [...current, id];
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-auto min-h-9 w-full justify-start whitespace-normal text-left font-normal" disabled={disabled || !productId || safeQty < 1}>
          {value?.length ? `${value.length} of ${safeQty} serials selected` : "Select pending serials"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select serial numbers</DialogTitle>
          <DialogDescription>Select exactly {safeQty} available serials for {productName || "this product"}.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading available serials...</div>
        ) : trackingEnabled === false ? (
          <div className="rounded-md border p-5 text-sm text-muted-foreground">Serial tracking is not enabled for this product. Generate its first range from the Serial Numbers page.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search serial number" />
              <Button type="button" variant="secondary" onClick={() => setPending(options.slice(0, safeQty).map((row) => row.id))} disabled={options.length < safeQty}>Select first {safeQty}</Button>
            </div>
            <div className="text-sm text-muted-foreground">{pending.length} selected · {options.length} available</div>
            <ScrollArea className="h-80 rounded-md border">
              <div className="grid gap-1 p-2 sm:grid-cols-2">
                {filtered.map((option) => {
                  const checked = pending.includes(option.id);
                  return (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-muted">
                      <Checkbox checked={checked} onCheckedChange={(next) => toggle(option.id, next === true)} disabled={!checked && pending.length >= safeQty} />
                      <span className="font-mono text-sm">{option.serialNumber}</span>
                      {checked ? <Check className="ml-auto size-4 text-green-600" /> : null}
                    </label>
                  );
                })}
                {!filtered.length ? <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">No available serial numbers found.</div> : null}
              </div>
            </ScrollArea>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={() => { onChange(pending); setOpen(false); }} disabled={trackingEnabled === true && pending.length !== safeQty}>Use selected serials</Button>
        </DialogFooter>
      </DialogContent>
      {selectedLabels.length ? <div className="mt-1 text-xs text-muted-foreground">{selectedLabels.join(", ")}</div> : null}
    </Dialog>
  );
}
