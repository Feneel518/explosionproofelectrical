"use client";

import { parseAsString, useQueryState } from "nuqs";
import { ProductCard } from "@/components/marketing/ProductCard";
import type {
  CatalogFilterOption,
  CatalogProductCard,
} from "@/lib/marketing/catalog";

type CatalogFiltersProps = {
  filters: CatalogFilterOption[];
  products: CatalogProductCard[];
};

export function CatalogFilters({ filters, products }: CatalogFiltersProps) {
  const [activeFilter, setActiveFilter] = useQueryState(
    "cat",
    parseAsString.withDefault("all").withOptions({
      clearOnDefault: true,
      shallow: true,
    }),
  );

  const shownProducts =
    activeFilter === "all"
      ? products
      : products.filter((product) => product.filter === activeFilter);

  return (
    <>
      <div className="flex overflow-x-auto border-b border-t border-white/12 bg-[#04121b]">
        {filters.map((filter) => {
          const selected = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`shrink-0 border-r border-white/12 px-5 py-4 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.12em] transition-colors sm:px-6 ${
                selected
                  ? "bg-[#E46414] text-[#04121b]"
                  : "bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
              }`}>
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3">
        {shownProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
