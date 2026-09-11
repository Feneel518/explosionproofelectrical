"use client";

import Link from "next/link";
import { Search, ArrowUpRight, X } from "lucide-react";
import { useQueryState } from "nuqs";
import type { CatalogFilterOption, CatalogProductCard } from "@/lib/marketing/catalog";
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

  return <>
    <div className={styles.pdfDownload}><CatalogPdfDownload /></div>
    <section className={styles.catalogIntro}><div className={styles.introTop}><span className={styles.eyebrow}>ExEC / THE PRODUCT COLLECTION</span><span className={styles.eyebrow}>ENGINEERED IN VAPI, INDIA</span></div><div className={styles.introGrid}><div><h1>BUILT FOR<br /><span>YOUR ENVIRONMENT.</span></h1><p>Flameproof lighting, control panels, instrumentation and enclosures. Find the right starting point for your next specification.</p></div><div className={styles.catalogAside}><span className={styles.bigNumber}>{String(products.length).padStart(2, "0")}<small>PRODUCTS / ONE COMMITMENT</small></span><p>A complete collection, ready to pass on.<br />Share the catalog or a focused selection.</p></div></div><ShareActions title={`ExEC product catalog${category !== "all" ? ` — ${activeFilter?.label || category}` : ""}`} path={sharePath} label="Share catalog" printable /></section>
    <section className={styles.catalogWorkspace} aria-label="Product catalog"><aside className={styles.filters}><div className={styles.filterHeading}>EXPLORE THE RANGE <span>[{filters.length - 1}]</span></div><div className={styles.filterList} role="group" aria-label="Product category">{filters.map((filter) => <button type="button" key={filter.value} aria-pressed={category === filter.value} onClick={() => void setCategory(filter.value === "all" ? null : filter.value)}><span>{filter.label === "All" ? "All products" : filter.label}</span><small>{filter.value === "all" ? products.length : products.filter((product) => product.filter === filter.value).length}</small></button>)}</div><div className={styles.filterNote}><span>[Ex]</span><h2>A different<br />specification?</h2><p>From a single junction box to a complete control panel, let’s build around your requirements.</p><Link href="/#contact">TALK TO OUR TEAM <ArrowUpRight size={16} /></Link></div></aside><div className={styles.results}><div className={styles.searchToolbar}><label className={styles.search}><Search size={18} /><input type="search" aria-label="Search products" placeholder="Search products, type numbers, ratings…" value={query} onChange={(event) => void setQuery(event.target.value || null)} /></label><label className={styles.sort}>SORT BY<select aria-label="Sort products" value={sort} onChange={(event) => void setSort(event.target.value === "featured" ? null : event.target.value)}><option value="featured">Collection order</option><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option></select></label></div><div className={styles.resultsBar}><span role="status">{filtered.length} {filtered.length === 1 ? "product" : "products"} / {activeFilter?.label === "All" ? "Complete collection" : activeFilter?.label || "Unknown category"}</span>{(category !== "all" || query || sort !== "featured") && <button onClick={reset}>Reset filters <X size={14} /></button>}</div>{filtered.length ? <div className={styles.productGrid}>{filtered.map((product, index) => <CatalogCard product={product} key={product.slug} index={index} />)}</div> : <div className={styles.empty}><Search size={30} /><h2>{products.length ? "No matching products." : "Our collection is being updated."}</h2><p>{products.length ? "Try a different product name, type number or category." : "Contact our team for the latest product availability and specifications."}</p>{products.length ? <button onClick={reset}>Clear all filters <ArrowUpRight size={16} /></button> : <Link href="/#contact">Contact our team <ArrowUpRight size={16} /></Link>}</div>}</div></section>
    <div className={styles.closingBand}><span>YOUR NEXT PROJECT STARTS WITH THE RIGHT DETAILS.</span><Link href="/#contact">LET’S TALK SPECIFICATIONS <ArrowUpRight size={20} /></Link></div>
  </>;
}
