import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { CatalogCard } from "@/components/marketing/design-preview/CatalogCard";
import { getCatalogCategory } from "@/lib/marketing/catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/catalog.module.css";
import { getCategoryLanding } from "@/lib/seo/categories";
import { getKnowledgeArticle } from "@/lib/marketing/knowledge";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ categorySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCatalogCategory((await params).categorySlug);
  if (!data) return { title: "Category not found", robots: { index: false } };
  const title = `${data.category.name} Manufacturer in India`;
  const description = getCategoryLanding(data.category.slug)?.description || `Explore ExEC ${data.category.name.toLowerCase()}. Compare available products and request technical specifications from our Vapi engineering team.`;
  return { title, description, robots: data.products.length ? undefined : { index: false, follow: true }, alternates: { canonical: `/catalog/category/${data.category.slug}` }, openGraph: { title: `${title} | ExEC`, description, url: absoluteUrl(`/catalog/category/${data.category.slug}`), type: "website" } };
}

export default async function CatalogCategoryPage({ params }: Props) {
  const data = await getCatalogCategory((await params).categorySlug);
  if (!data) notFound();
  const landing = getCategoryLanding(data.category.slug);
  const url = absoluteUrl(`/catalog/category/${data.category.slug}`);
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: `${data.category.name} Manufacturer in India`, url, description: `ExEC ${data.category.name} product range for hazardous-area applications.`, mainEntity: { "@type": "ItemList", numberOfItems: data.products.length, itemListElement: data.products.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(`/catalog/${product.slug}`), name: product.name })) } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Catalog", item: absoluteUrl("/catalog") }, { "@type": "ListItem", position: 3, name: data.category.name, item: url }] },
    { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME, url: absoluteUrl("/") },
  ] };
  return <IndustrialFonts><IndustrialShell>
    <JsonLd data={schema} />
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/catalog"><ArrowLeft size={15} /> Catalog</Link><span>/</span><span aria-current="page">{data.category.name}</span></nav>
    <section className={styles.categoryHero}><span className={styles.eyebrow}>ExEC / PRODUCT RANGE / ENGINEERED IN VAPI</span><div><h1>{data.category.name}<br /><span>manufacturer in India.</span></h1><p>{landing?.description || `Explore our ${data.category.name.toLowerCase()} range. Review product details, available configurations and technical information before requesting a project-specific quotation.`}</p></div></section>
    <section className={styles.categoryProducts} aria-label={`${data.category.name} products`}><div className={styles.categoryCount}><span>{String(data.products.length).padStart(2, "0")}</span><small>AVAILABLE PRODUCTS</small></div>{data.products.length ? <div className={styles.productGrid}>{data.products.map((product, index) => <CatalogCard product={product} index={index} key={product.slug} />)}</div> : <div className={styles.empty}><h2>Range being updated.</h2><p>Contact our engineering team for the latest specifications and availability.</p><Link href="/#contact">Talk to our team <ArrowUpRight size={16} /></Link></div>}</section>
    {landing && <section className={styles.selectionContent} aria-label={`${landing.name} selection guide`}>
      <h2>How to specify {landing.name.toLowerCase()}</h2>{landing.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <h3>Information to include with your enquiry</h3><ul>{landing.checklist.map(item => <li key={item}>{item}</li>)}</ul>
      <h3>Engineering references and related products</h3><nav className={styles.resourceLinks} aria-label="Related technical resources">
        {landing.guides.map(slug => <Link key={slug} href={`/knowledge-hub/${slug}`}>{getKnowledgeArticle(slug)?.title}</Link>)}
        {landing.related.map(slug => <Link key={slug} href={`/catalog/category/${slug}`}>{getCategoryLanding(slug)?.name}</Link>)}
        <Link href="/certifications">Certification documents</Link><Link href="/industries">Industry applications</Link><Link href="/contact">Request a quotation</Link>
      </nav><h3>Frequently asked questions</h3>{landing.faq.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
    </section>}
    <div className={styles.closingBand}><span>NEED A CONFIGURATION FOR A SPECIFIC AREA CLASSIFICATION?</span><Link href="/knowledge-hub">VISIT THE KNOWLEDGE CENTRE <ArrowUpRight size={20} /></Link></div>
  </IndustrialShell></IndustrialFonts>;
}
