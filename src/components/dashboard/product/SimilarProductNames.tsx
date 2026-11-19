"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { findSimilarProductNames } from "@/lib/actions/dashboard/products/findSimilarProductNames";
import { productNameSearchTerms, type SimilarProductName } from "@/lib/products/similarProductNames";

export default function SimilarProductNames({ name, categoryId }: { name: string; categoryId?: string }) {
  const query = name.trim();
  const debouncedQuery = useDebouncedValue(query, 300);
  const headingId = React.useId();
  const [result, setResult] = React.useState<{ key: string; ok: boolean; items: SimilarProductName[] } | null>(null);
  const key = JSON.stringify([debouncedQuery, categoryId || null]);
  const enabled = productNameSearchTerms(debouncedQuery).length > 0;

  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    findSimilarProductNames({ query: debouncedQuery, categoryId: categoryId || undefined })
      .then(response => { if (active) setResult({ key, ...response }); })
      .catch(() => { if (active) setResult({ key, ok: false, items: [] }); });
    return () => { active = false; };
  }, [debouncedQuery, categoryId, enabled, key]);

  if (!enabled || query !== debouncedQuery) return null;
  const current = result?.key === key ? result : null;
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby={headingId} aria-busy={!current}>
      <div className="flex flex-col gap-1">
        <h3 id={headingId} className="text-sm font-medium">Similar products</h3>
        <p className="text-sm text-muted-foreground">Check existing products first. If the family already exists, add a variant to it.</p>
      </div>
      {!current ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Checking similar product names">
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
      ) : !current.ok ? (
        <p className="text-sm" role="status">Couldn’t check similar names. <Link className="underline underline-offset-4" href={`/dashboard/products?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">Search products</Link> before submitting.</p>
      ) : current.items.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">No similar names found. You can continue creating this product.</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-live="polite" aria-label="Similar product names">
          {current.items.map(item => (
            <li key={`${item.kind}:${item.id}`} className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {item.kind === "product" ? (
                  <Link href={`/dashboard/products/${item.id}`} target="_blank" rel="noopener noreferrer" className="w-fit max-w-full break-words text-sm font-medium underline underline-offset-4">{item.name}<span className="sr-only"> (opens in a new tab)</span></Link>
                ) : <p className="break-words text-sm font-medium">{item.name}</p>}
                <p className="text-sm text-muted-foreground">{item.kind === "pending" ? "Awaiting owner approval" : `${item.categoryName} · ${item.variantCount} ${item.variantCount === 1 ? "variant" : "variants"}`}</p>
                {item.matchedAlias ? <p className="break-words text-sm text-muted-foreground">Previous name: {item.matchedAlias}</p> : null}
              </div>
              {item.kind === "pending" ? <Badge variant="outline">Pending approval</Badge> : item.status === "INACTIVE" ? <Badge variant="outline">Inactive</Badge> : item.exact ? <Badge variant="secondary">Same name</Badge> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
