"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
import {
  SupplierSearchItem,
  searchSuppliersForSelectAction,
} from "@/lib/actions/dashboard/global/searchSuppliersForSelect";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSupplierForSelectById } from "@/lib/actions/dashboard/global/getSupplierForSelectById";

type Props = {
  value: string | null | undefined;
  onChange: (supplierId: string | null) => void;
  disabled?: boolean;

  placeholder?: string;

  /**
   * Called when user taps "Create supplier" inside the picker.
   * You can open a modal / route to create page.
   */
  onCreateSupplier?: () => void;

  /**
   * Optional: if you create a supplier in a modal and get back the created record,
   * call this to instantly select it.
   */
  onCreatedSelect?: (created: SupplierSearchItem) => void;
};

function secondaryLine(c: SupplierSearchItem) {
  const parts: string[] = [];
  if (c.city) parts.push([c.city].filter(Boolean).join(", "));
  return parts.join("   ");
}

function contactLine(c: SupplierSearchItem) {
  return (c.companyPhone ?? c.companyEmail ?? "").trim();
}

export function SupplierCombobox({
  value,
  onChange,
  placeholder = "Search & select supplier",
  disabled,
  onCreateSupplier,
}: Props) {
  // check for is mobile
  const isDesktop = !useIsMobile();

  //   ststates for open, search query, loading, items, next cursor, selected item
  const [open, setOpen] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search, 250);

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const [items, setItems] = React.useState<SupplierSearchItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [selectedItem, setSelectedItem] =
    React.useState<SupplierSearchItem | null>(null);

  const buttonLabel = selectedItem ? selectedItem.companyName : placeholder;

  async function loadFirstPage(query: string) {
    setLoading(true);
    try {
      const res = await searchSuppliersForSelectAction({
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
      const res = await searchSuppliersForSelectAction({
        query,
        cursor: nextCursor,
        take: 20,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const it of res.items) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  // Fetch when opened + on debounced search change
  React.useEffect(() => {
    if (!open) return;
    loadFirstPage(debounced ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debounced]);

  React.useEffect(() => {
    let cancelled = false;

    async function hydrateSelected() {
      if (!value) {
        setSelectedItem(null);
        return;
      }

      // if already hydrated, skip
      if (selectedItem?.id === value) return;

      // if present in current items list, use it
      const inList = items.find((x) => x.id === value);
      if (inList) {
        setSelectedItem(inList);
        return;
      }

      // otherwise fetch by id
      const fetched = await getSupplierForSelectById(value);
      if (!cancelled) setSelectedItem(fetched);
    }

    hydrateSelected();

    return () => {
      cancelled = true;
    };
    // include value + items changes so it catches after initial search loads too
  }, [value, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset list when closing to keep memory low (optional)
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
        placeholder="Search by name, phone, email, GSTIN, city"
        value={search}
        onValueChange={setSearch}
      />

      <CommandList className="">
        {/* Create supplier */}
        {onCreateSupplier ? (
          <>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onCreateSupplier();
                }}
                className="gap-2">
                <Plus className="h-4 w-4" />
                Create supplier
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading
          </div>
        ) : null}

        <CommandEmpty>
          {debounced?.trim()
            ? "No suppliers found."
            : "Start typing to search suppliers."}
        </CommandEmpty>

        <CommandGroup heading="Suppliers">
          {items.map((c) => {
            const isSelected = value === c.id;

            return (
              <CommandItem
                key={c.id}
                value={c.id}
                onSelect={() => {
                  setSelectedItem(c);
                  onChange(c.id);
                  setOpen(false);
                }}
                className={`flex items-start gap-2 ${isSelected ? "bg-primary/50 data-[state=active]:bg-primary/20 " : ""}`}>
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4",
                    isSelected ? "opacity-100" : "opacity-0",
                  )}
                />

                <div className="min-w-0">
                  <div className="truncate font-medium">{c.companyName}</div>

                  {contactLine(c) ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {contactLine(c)}
                    </div>
                  ) : null}

                  {secondaryLine(c) ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {secondaryLine(c)}
                    </div>
                  ) : null}
                </div>
              </CommandItem>
            );
          })}

          {/* Clear selection */}
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

          {/* Load more */}
          {nextCursor ? (
            <CommandItem
              onSelect={() => loadMore(debounced ?? "")}
              disabled={loadingMore}
              className="justify-center text-muted-foreground">
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more
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

  // Desktop: popover
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
          className="w-(--radix-popover-trigger-width) min-w-[250px]  p-0">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // Mobile: drawer
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
          <DrawerTitle>Select supplier</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
