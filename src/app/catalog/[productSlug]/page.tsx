import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { IndustrialProduct } from "@/components/marketing/design-preview/IndustrialProduct";
import { getCatalogProductDetail } from "@/lib/marketing/catalog";
import { absoluteUrl } from "@/lib/seo/site";

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
  return <IndustrialFonts><IndustrialShell><Suspense fallback={<p style={{ padding: 36 }}>Loading product details...</p>}><IndustrialProduct {...data} /></Suspense></IndustrialShell></IndustrialFonts>;
}
