import type { Metadata } from "next";
import Link from "next/link";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { industryPages } from "@/lib/seo/industries";
import { absoluteUrl } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/catalog.module.css";

export const metadata: Metadata = { title: "Flameproof Electrical Equipment by Industry", description: "Explore ExEC product families for oil and gas, chemical processing, pharmaceutical plants and refineries. Prepare an application-specific hazardous-area specification.", alternates: { canonical: "/industries" } };

export default function IndustriesPage() {
  return <IndustrialFonts><IndustrialShell>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "ExEC Industry Applications", url: absoluteUrl("/industries"), publisher: { "@id": absoluteUrl("/#organization") }, mainEntity: { "@type": "ItemList", itemListElement: industryPages.map((industry, index) => ({ "@type": "ListItem", position: index + 1, name: industry.name, url: absoluteUrl(`/industries/${industry.slug}`) })) } }} />
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">Industries</span></nav>
    <section className={styles.categoryHero}><span className={styles.eyebrow}>ExEC / APPLICATION ENGINEERING</span><div><h1>Flameproof equipment.<br /><span>Your application.</span></h1><p>Explore product families for your industry, then specify around the actual classified location, electrical duty and operating conditions.</p></div></section>
    {industryPages.map(industry => <section className={styles.selectionContent} key={industry.slug}><h2><Link href={`/industries/${industry.slug}`}>{industry.name}</Link></h2><p>{industry.description}</p><nav className={styles.resourceLinks}><Link href={`/industries/${industry.slug}`}>Review application requirements</Link></nav></section>)}
  </IndustrialShell></IndustrialFonts>;
}
