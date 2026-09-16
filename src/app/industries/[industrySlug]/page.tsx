import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { industryPages } from "@/lib/seo/industries";
import { getCategoryLanding } from "@/lib/seo/categories";
import { absoluteUrl } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/catalog.module.css";

type Props = { params: Promise<{ industrySlug: string }> };
export function generateStaticParams() { return industryPages.map(industry => ({ industrySlug: industry.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industrySlug } = await params;
  const industry = industryPages.find(item => item.slug === industrySlug);
  return industry ? { title: industry.title, description: industry.description, alternates: { canonical: `/industries/${industry.slug}` }, openGraph: { title: industry.title, description: industry.description, url: absoluteUrl(`/industries/${industry.slug}`), type: "website" } } : { title: "Industry not found", robots: { index: false } };
}

export default async function IndustryPage({ params }: Props) {
  const { industrySlug } = await params;
  const industry = industryPages.find(item => item.slug === industrySlug);
  if (!industry) notFound();
  const url = absoluteUrl(`/industries/${industry.slug}`);
  return <IndustrialFonts><IndustrialShell>
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [
      { "@type": "WebPage", "@id": `${url}#page`, name: industry.title, description: industry.description, url, publisher: { "@id": absoluteUrl("/#organization") }, about: { "@type": "Thing", name: industry.name } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Industries", item: absoluteUrl("/industries") }, { "@type": "ListItem", position: 3, name: industry.name, item: url }] },
    ] }} />
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/industries">Industries</Link><span>/</span><span aria-current="page">{industry.name}</span></nav>
    <section className={styles.categoryHero}><span className={styles.eyebrow}>ExEC / INDUSTRY APPLICATIONS / INDIA</span><div><h1>{industry.name}<br /><span>Flameproof electrical equipment.</span></h1><p>{industry.description}</p></div></section>
    <section className={styles.selectionContent}><h2>Specify for the actual installation</h2>{industry.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<h3>Project inputs</h3><ul>{industry.checklist.map(item => <li key={item}>{item}</li>)}</ul><h3>Explore relevant product families</h3><nav className={styles.resourceLinks} aria-label="Relevant product families">{industry.categories.map(slug => <Link key={slug} href={`/catalog/category/${slug}`}>{getCategoryLanding(slug)?.name}</Link>)}</nav><nav className={styles.resourceLinks} aria-label="Application engineering resources"><Link href="/knowledge-hub/zone-0-zone-1-zone-2-hazardous-areas">Hazardous-area zones</Link><Link href="/certifications">Certificate verification</Link><Link href="/contact">Discuss your project</Link></nav></section>
  </IndustrialShell></IndustrialFonts>;
}
