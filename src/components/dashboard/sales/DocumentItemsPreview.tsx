"use client";

import * as React from "react";
import Link from "next/link";
import { HoverCard } from "radix-ui";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getDocumentItemsPreviewAction,
  type DocumentPreviewItem,
  type SalesDocumentKind,
} from "@/lib/actions/dashboard/sales/getDocumentItemsPreviewAction";

type Props = {
  kind: SalesDocumentKind;
  id: string;
  number: string;
  href: string;
  mobile?: boolean;
};

export default function DocumentItemsPreview({
  kind,
  id,
  number,
  href,
  mobile = false,
}: Props) {
  const [items, setItems] = React.useState<DocumentPreviewItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const requestInFlight = React.useRef(false);

  const load = React.useCallback(async () => {
    if (items !== null || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    setError(false);
    try {
      const result = await getDocumentItemsPreviewAction(kind, id);
      if (result.ok) setItems(result.items);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [id, items, kind]);

  const content = (
    <div className="w-[min(24rem,calc(100vw-2rem))]">
      <div className="border-b px-4 py-3">
        <div className="text-sm font-semibold">Items in {number}</div>
        {items !== null && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
        )}
      </div>
      {loading ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">Loading items…</p>
      ) : error ? (
        <div className="px-4 py-4 text-sm">
          <p>Could not load items.</p>
          <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      ) : items?.length ? (
        <ol className="max-h-72 divide-y overflow-y-auto">
          {items.map((item, index) => (
            <li key={index} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="break-words font-medium">{item.title}</div>
                {(item.typeNumber || item.sku) && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {item.typeNumber || item.sku}
                  </div>
                )}
              </div>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {item.qty} {item.unit || ""}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-5 text-sm text-muted-foreground">No items added yet.</p>
      )}
    </div>
  );

  if (mobile) {
    return (
      <Popover onOpenChange={(open) => { if (open) void load(); }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">Preview items</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">{content}</PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard.Root openDelay={250} closeDelay={150} onOpenChange={(open) => { if (open) void load(); }}>
      <HoverCard.Trigger asChild>
        <Link className="font-medium underline-offset-2 hover:underline focus-visible:underline" href={href}>
          {number}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 rounded-md border bg-popover text-popover-foreground shadow-lg outline-none"
        >
          {content}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
