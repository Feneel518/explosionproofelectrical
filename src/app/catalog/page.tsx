import Link from "next/link";
import { CatalogFilters } from "@/components/marketing/CatalogFilters";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { getCatalogData } from "@/lib/marketing/catalog";

export default async function CatalogPage() {
  const { filters, products } = await getCatalogData();

  return (
    <MarketingShell active="catalog">
      <section className="border-b border-white/12 bg-[#061d2b] px-5 py-14 sm:px-10 lg:px-[60px] lg:py-[74px]">
        <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.18em] text-white/55">
          <Link href="/" className="text-[#F17D1E]">Home</Link> &nbsp;/&nbsp; Catalog
        </div>
        <h1 className="font-[family-name:var(--font-marketing-display)] text-6xl uppercase leading-none sm:text-[84px]">
          Product Catalog
        </h1>
        <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/70">
          Flameproof lighting, control panels, instrumentation and enclosures for certified hazardous-area installations.
        </p>
      </section>
      <CatalogFilters filters={filters} products={products} />
    </MarketingShell>
  );
}
