"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useDebouncedValue } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  InvoiceableOrderSearchItem,
  searchInvoiceableOrdersForSelectAction,
} from "@/lib/actions/dashboard/sales/invoice/searchInvoiceableOrdersForSelectAction";
import { getInvoiceableOrderForSelectById } from "@/lib/actions/dashboard/sales/invoice/getInvoiceableOrderForSelectById";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

type Props = {
  value: string | null | undefined;
  onChange: (salesOrderId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

function clientLine(order: InvoiceableOrderSearchItem) {
  return order.customerName ?? order.clientNameSnapshot ?? "";
}

function secondaryLine(order: InvoiceableOrderSearchItem) {
  const parts: string[] = [];
  if (order.poNumber) parts.push(`PO: ${order.poNumber}`);
  parts.push(`Pending Qty: ${order.totalPendingQty}`);
  return parts.join(" • ");
}

function labelOf(order: InvoiceableOrderSearchItem) {
  return formatFinancialDocumentNumber(order.orderFy, order.orderNo);
}

export function SalesOrderCombobox({
  value,
  onChange,
  placeholder = "Search & select sales order",
  disabled,
}: Props) {
  const isDesktop = !useIsMobile();

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search, 250);

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const [items, setItems] = React.useState<InvoiceableOrderSearchItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [selectedItem, setSelectedItem] =
    React.useState<InvoiceableOrderSearchItem | null>(null);

  const buttonLabel = selectedItem
    ? `${labelOf(selectedItem)} • ${clientLine(selectedItem) || "Unnamed Client"}`
    : placeholder;

  async function loadFirstPage(query: string) {
    setLoading(true);
    try {
      const res = await searchInvoiceableOrdersForSelectAction({
        query,
        cursor: null,
        take: 20,
      });
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore(query: string) {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await searchInvoiceableOrdersForSelectAction({
        query,
        cursor: nextCursor,
        take: 20,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const it of res.items) {
          if (!seen.has(it.id)) merged.push(it);
        }
        return merged;
      });
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    loadFirstPage(debounced ?? "");
  }, [open, debounced]);

  React.useEffect(() => {
    let cancelled = false;

    async function hydrateSelected() {
      if (!value) {
        setSelectedItem(null);
        return;
      }

      if (selectedItem?.id === value) return;

      const inList = items.find((x) => x.id === value);
      if (inList) {
        setSelectedItem(inList);
        return;
      }

      const fetched = await getInvoiceableOrderForSelectById(value);
      if (!cancelled) setSelectedItem(fetched);
    }

    hydrateSelected();

    return () => {
      cancelled = true;
    };
  }, [value, items]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setItems([]);
      setNextCursor(null);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [open]);

  const content = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search by order no, client, PO number…"
        value={search}
        onValueChange={setSearch}
      />

      <CommandList>
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : null}

        <CommandEmpty>
          {debounced?.trim()
            ? "No invoiceable orders found."
            : "Start typing to search sales orders."}
        </CommandEmpty>

        <CommandGroup heading="Sales Orders">
          {items.map((order) => {
            const isSelected = value === order.id;

            return (
              <CommandItem
                key={order.id}
                value={order.id}
                onSelect={() => {
                  setSelectedItem(order);
                  onChange(order.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-start gap-2",
                  isSelected &&
                    "bg-primary/50 data-[state=active]:bg-primary/20",
                )}>
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4",
                    isSelected ? "opacity-100" : "opacity-0",
                  )}
                />

                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {labelOf(order)}{" "}
                    {order.poNumber ? `- ${order.poNumber}` : ""}
                  </div>

                  {clientLine(order) ? (
                    <div className="truncate text-xs ">{clientLine(order)}</div>
                  ) : null}

                  <div className="truncate text-xs text-muted-foreground">
                    {secondaryLine(order)}
                  </div>
                </div>
              </CommandItem>
            );
          })}

          {value ? (
            <CommandItem
              onSelect={() => {
                setSelectedItem(null);
                onChange(null);
                setOpen(false);
              }}
              className="text-destructive">
              Clear selection
            </CommandItem>
          ) : null}

          {nextCursor ? (
            <CommandItem
              onSelect={() => loadMore(debounced ?? "")}
              disabled={loadingMore}
              className="justify-center text-muted-foreground">
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more…
                </span>
              ) : (
                "Load more"
              )}
            </CommandItem>
          ) : null}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between">
            <span
              className={cn(
                "truncate",
                !selectedItem && "text-muted-foreground",
              )}>
              {buttonLabel}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-[320px] p-0">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between">
          <span
            className={cn(
              "truncate",
              !selectedItem && "text-muted-foreground",
            )}>
            {buttonLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select sales order</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
