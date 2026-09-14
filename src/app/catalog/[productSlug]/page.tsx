import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { IndustrialProduct } from "@/components/marketing/design-preview/IndustrialProduct";
import { getCatalogProductDetail } from "@/lib/marketing/catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ productSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const data = await getCatalogProductDetail(productSlug);
  if (!data) return { title: "Product not found", robots: { index: false } };
  const { product } = data;
  return {
    title: product.name, description: product.description,
    alternates: { canonical: `/catalog/${product.slug}` },
    openGraph: { title: `${product.name} | ExEC`, description: product.description, url: absoluteUrl(`/catalog/${product.slug}`), type: "website", ...(product.image ? { images: [{ url: product.image, alt: product.name }] } : {}) },
    twitter: { card: "summary_large_image", title: `${product.name} | ExEC`, description: product.description, ...(product.image ? { images: [product.image] } : {}) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { productSlug } = await params;
  const data = await getCatalogProductDetail(productSlug);
  if (!data) notFound();
  const { product } = data;
  const url = absoluteUrl(`/catalog/${product.slug}`);
  const properties = [
    ["Protection", product.protection], ["Gas group", product.gasGroup],
    ["Material", product.material], ["Finish", product.finish],
    ["Zones", product.zones.join(", ")],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "Product", name: product.name, description: product.description, image: product.image ? [product.image] : undefined, category: product.cat, url, sku: product.variants[0]?.sku || undefined, model: product.variants[0]?.typeNumber || product.type, manufacturer: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") }, additionalProperty: properties.map(([name, value]) => ({ "@type": "PropertyValue", name, value })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Catalog", item: absoluteUrl("/catalog") },
      { "@type": "ListItem", position: 3, name: product.cat, item: absoluteUrl(`/catalog/category/${product.categorySlug}`) },
      { "@type": "ListItem", position: 4, name: product.name, item: url },
    ] },
  ] };
  return <IndustrialFonts><IndustrialShell><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><Suspense fallback={<p style={{ padding: 36 }}>Loading product details...</p>}><IndustrialProduct {...data} /></Suspense></IndustrialShell></IndustrialFonts>;
}
