"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/useDebounce";
import {
  searchStockSummaryRowsAction,
  StockSummaryListItem,
} from "@/lib/actions/dashboard/inventory/stock/searchStockSummaryRowsAction";

const PAGE_SIZE = 40;

type StockSummaryInfiniteTableProps = {
  monthLabel: string;
  threshold: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function StockSummaryInfiniteTable({
  monthLabel,
  threshold,
}: StockSummaryInfiniteTableProps) {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [items, setItems] = React.useState<StockSummaryListItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const activeQueryRef = React.useRef("");
  const normalizedQuery = debouncedSearch.trim().toLowerCase();

  const loadMore = React.useCallback(async () => {
    if (!nextCursor || isInitialLoading || isLoadingMore) return;

    const queryAtRequestTime = normalizedQuery;
    setIsLoadingMore(true);
    setError(null);

    try {
      const res = await searchStockSummaryRowsAction({
        query: debouncedSearch,
        cursor: nextCursor,
        take: PAGE_SIZE,
      });
      if (activeQueryRef.current !== queryAtRequestTime) return;

      setItems((prev) => {
        const seen = new Set(prev.map((row) => row.id));
        const merged = [...prev];
        for (const row of res.items) {
          if (!seen.has(row.id)) merged.push(row);
        }
        return merged;
      });
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error(err);
      setError("Could not load more stock rows.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [debouncedSearch, isInitialLoading, isLoadingMore, nextCursor, normalizedQuery]);

  React.useEffect(() => {
    let cancelled = false;
    const requestQuery = normalizedQuery;
    activeQueryRef.current = requestQuery;

    async function loadFirstPage() {
      setIsInitialLoading(true);
      setError(null);

      try {
        const res = await searchStockSummaryRowsAction({
          query: debouncedSearch,
          cursor: null,
          take: PAGE_SIZE,
        });
        if (cancelled || activeQueryRef.current !== requestQuery) return;

        setItems(res.items);
        setNextCursor(res.nextCursor);
      } catch (err) {
        console.error(err);
        if (cancelled || activeQueryRef.current !== requestQuery) return;
        setItems([]);
        setNextCursor(null);
        setError("Could not load stock rows.");
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
          setHasLoadedOnce(true);
        }
      }
    }

    void loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, normalizedQuery]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMore();
          }
        }
      },
      { root: null, rootMargin: "240px 0px 240px 0px", threshold: 0.01 },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="rounded-xl border p-2">
      <div className="flex items-center gap-2 p-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by item name, code, SKU, HSN, drawing number..."
          className="h-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Item</TableHead>
            <TableHead className="text-white">Code / HSN / Unit</TableHead>
            <TableHead className="text-white">Opening ({monthLabel})</TableHead>
            <TableHead className="text-white">Inward MTD</TableHead>
            <TableHead className="text-white">Consumed MTD</TableHead>
            <TableHead className="text-white">Consumed (All)</TableHead>
            <TableHead className="text-white">On Hand</TableHead>
            <TableHead className="text-white">Available</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white">Last Movement</TableHead>
            <TableHead className="text-white">Last Reference</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isInitialLoading ? (
            <TableRow>
              <TableCell colSpan={11} className="py-10">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading stock rows...
                </div>
              </TableCell>
            </TableRow>
          ) : null}

          {!isInitialLoading && items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                {debouncedSearch.trim()
                  ? "No stock rows match this search."
                  : "No stock balances found."}
              </TableCell>
            </TableRow>
          ) : null}

          {!isInitialLoading
            ? items.map((row) => {
                const isLow = row.qtyAvailable <= threshold;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        {row.itemHref ? (
                          <Link className="hover:underline" href={row.itemHref}>
                            {row.title}
                          </Link>
                        ) : (
                          row.title
                        )}
                      </div>
                      {row.subtitle ? (
                        <div className="text-xs text-muted-foreground">{row.subtitle}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.meta || "-"}</TableCell>
                    <TableCell>{formatNumber(row.openingQty)}</TableCell>
                    <TableCell>{formatNumber(row.monthInQty)}</TableCell>
                    <TableCell>{formatNumber(row.monthOutQty)}</TableCell>
                    <TableCell>{formatNumber(row.consumedQty)}</TableCell>
                    <TableCell>{formatNumber(row.qtyOnHand)}</TableCell>
                    <TableCell>{formatNumber(row.qtyAvailable)}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive">LOW</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(row.lastMovementAt)}
                      {row.lastMovementType ? (
                        <div className="text-xs text-muted-foreground">
                          {row.lastMovementType} • IN {row.lastMovementQtyIn ?? 0} / OUT{" "}
                          {row.lastMovementQtyOut ?? 0}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {row.lastReferenceLabel ? (
                        <>
                          <div className="text-sm">
                            {row.lastReferenceHref ? (
                              <Link className="hover:underline" href={row.lastReferenceHref}>
                                {row.lastReferenceLabel}
                              </Link>
                            ) : (
                              row.lastReferenceLabel
                            )}
                          </div>
                          {row.lastReferenceSubtext ? (
                            <div className="text-xs text-muted-foreground">
                              {row.lastReferenceSubtext}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            : null}
        </TableBody>
      </Table>

      {error ? (
        <div className="px-2 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {hasLoadedOnce ? <div ref={sentinelRef} className="h-5 w-full" /> : null}

      {isLoadingMore ? (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more...
        </div>
      ) : null}
    </div>
  );
}
