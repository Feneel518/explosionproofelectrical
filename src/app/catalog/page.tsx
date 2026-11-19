import type { Metadata } from "next";
import { Suspense } from "react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { IndustrialCatalog } from "@/components/marketing/design-preview/IndustrialCatalog";
import { getCatalogData } from "@/lib/marketing/catalog";
import { absoluteUrl } from "@/lib/seo/site";
import Link from "next/link";
import { categoryLandings } from "@/lib/seo/categories";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/marketing/design-preview/catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Flameproof Electrical Products Manufacturer in India",
  description: "Explore ExEC flameproof junction boxes, lighting, switchgear, panels and cable glands manufactured in Vapi, India. Compare configurations and request specifications.",
  alternates: { canonical: "/catalog" },
  openGraph: { title: "ExEC | Product Catalog", description: "The complete ExEC product collection. Engineered in Vapi since 1996.", url: absoluteUrl("/catalog"), type: "website" },
};

export default async function CatalogPage() {
  const data = await getCatalogData();
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", "@id": absoluteUrl("/catalog#collection"), name: "ExEC Flameproof Electrical Products", url: absoluteUrl("/catalog"), publisher: { "@id": absoluteUrl("/#organization") }, mainEntity: { "@type": "ItemList", numberOfItems: data.products.length, itemListElement: data.products.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.name, url: absoluteUrl(`/catalog/${product.slug}`) })) } };
  return <IndustrialFonts><IndustrialShell><JsonLd data={schema} /><Suspense fallback={<p style={{ padding: 36 }}>Loading product collection...</p>}><IndustrialCatalog {...data} /></Suspense>
    <section className={styles.selectionContent}><h2>Explore flameproof product families</h2><p>Find application details, specification checklists and related engineering references for each product family.</p><nav className={styles.resourceLinks} aria-label="Product family landing pages">{categoryLandings.map(category => <Link key={category.slug} href={`/catalog/category/${category.slug}`}>{category.name}</Link>)}</nav>
      <nav className={styles.resourceLinks} aria-label="Catalog supporting resources"><Link href="/knowledge-hub">Hazardous-area engineering guides</Link><Link href="/industries">Industry applications</Link><Link href="/certifications">Certification documents</Link></nav>
    </section>
  </IndustrialShell></IndustrialFonts>;
}
