"use client";

import Link from "next/link";
import { Search, ArrowUpRight, X } from "lucide-react";
import { useQueryState } from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import type { CatalogFilterOption, CatalogProductCard } from "@/lib/marketing/catalog";
import { RevealLines } from "@/components/site/motion";
import { CatalogCard } from "./CatalogCard";
import { ShareActions } from "./ShareActions";
import { CatalogPdfDownload } from "./CatalogPdfDownload";
import styles from "./catalog.module.css";

export function IndustrialCatalog({ products, filters }: { products: CatalogProductCard[]; filters: CatalogFilterOption[] }) {
  const [category, setCategory] = useQueryState("cat", { defaultValue: "all", history: "push" });
  const [query, setQuery] = useQueryState("q", { defaultValue: "", history: "replace" });
  const [sort, setSort] = useQueryState("sort", { defaultValue: "featured", history: "push" });
  const activeFilter = filters.find((filter) => filter.value === category);
  const filtered = products.filter((product) => (category === "all" || product.filter === category) && `${product.name} ${product.cat} ${product.type} ${product.ip} ${product.group} ${product.searchText} ${product.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (sort === "az") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "za") filtered.sort((a, b) => b.name.localeCompare(a.name));
  const params = new URLSearchParams();
  if (category !== "all") params.set("cat", category);
  if (query) params.set("q", query);
  if (sort !== "featured") params.set("sort", sort);
  const sharePath = `/catalog${params.size ? `?${params}` : ""}`;
  const reset = () => { void setCategory(null); void setQuery(null); void setSort(null); };
  const filtersActive = category !== "all" || Boolean(query) || sort !== "featured";

  return <>
    <section className={styles.catalogIntro}>
      <div className={styles.introGrid}>
        <div>
          <span className={styles.eyebrow}>The product collection</span>
          <RevealLines as="h1" play lines={["Built for", <em key="e" className="serif">your environment.</em>]} />
          <p>Flameproof lighting, control stations, junction boxes, glands and panels. Find the right starting point for your next specification.</p>
        </div>
        <div className={styles.catalogAside}>
          <span className={styles.bigNumber}>{String(products.length).padStart(2, "0")}<small>Products in the collection</small></span>
          <div className={styles.pdfDownload}><CatalogPdfDownload /></div>
          <ShareActions title={`ExEC product catalog${category !== "all" ? ` — ${activeFilter?.label || category}` : ""}`} path={sharePath} label="Share" printable />
        </div>
      </div>
    </section>

    <section className={styles.catalogWorkspace} aria-label="Product catalog" data-no-reveal>
      <div className={styles.toolbar}>
        <div className={styles.filterList} role="group" aria-label="Product category">
          {filters.map((filter) => <button type="button" key={filter.value} aria-pressed={category === filter.value} onClick={() => void setCategory(filter.value === "all" ? null : filter.value)}>
            {category === filter.value && <motion.span layoutId="catalog-filter" className={styles.filterPill} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span>{filter.label === "All" ? "All products" : filter.label.replace(/^Flameproof\s+/i, "")}</span>
            <small>{filter.value === "all" ? products.length : products.filter((product) => product.filter === filter.value).length}</small>
          </button>)}
        </div>
        <div className={styles.searchToolbar}>
          <label className={styles.search}><Search size={18} /><input type="search" aria-label="Search products" placeholder="Search products, type numbers, ratings…" value={query} onChange={(event) => void setQuery(event.target.value || null)} /></label>
          <label className={styles.sort}><span>Sort</span><select aria-label="Sort products" value={sort} onChange={(event) => void setSort(event.target.value === "featured" ? null : event.target.value)}><option value="featured">Collection order</option><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option></select></label>
        </div>
      </div>

      <div className={styles.resultsBar}>
        <span role="status">{filtered.length} {filtered.length === 1 ? "product" : "products"} · {activeFilter?.label === "All" ? "Complete collection" : activeFilter?.label || "Unknown category"}</span>
        {filtersActive && <button type="button" onClick={reset}>Reset filters <X size={14} /></button>}
      </div>

      {filtered.length ? <motion.div layout className={styles.productGrid}>
        <AnimatePresence mode="popLayout">
          {filtered.map((product, index) => <motion.div key={product.slug} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
            <CatalogCard product={product} index={index} />
          </motion.div>)}
        </AnimatePresence>
      </motion.div> : <div className={styles.empty}>
        <Search size={30} />
        <h2>{products.length ? "No matching products." : "Our collection is being updated."}</h2>
        <p>{products.length ? "Try a different product name, type number or category." : "Contact our team for the latest product availability and specifications."}</p>
        {products.length ? <button type="button" onClick={reset}>Clear all filters <ArrowUpRight size={16} /></button> : <Link href="/contact">Contact our team <ArrowUpRight size={16} /></Link>}
      </div>}

      <div className={styles.filterNote}>
        <div><span className={styles.eyebrow}>Engineered to order</span><h2>A different specification?</h2><p>From a single junction box to a complete control panel — let’s build around your requirement.</p></div>
        <Link href="/contact">Talk to our team <ArrowUpRight size={17} /></Link>
      </div>
    </section>
  </>;
}
