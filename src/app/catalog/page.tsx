import type { Metadata } from "next";
import { Suspense } from "react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { IndustrialCatalog } from "@/components/marketing/design-preview/IndustrialCatalog";
import { getCatalogData } from "@/lib/marketing/catalog";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Product Catalog",
  description: "Explore ExEC flameproof lighting, control panels, instrumentation and enclosures. Browse specifications and share products with your team.",
  alternates: { canonical: "/catalog" },
  openGraph: { title: "ExEC | Product Catalog", description: "The complete ExEC product collection. Engineered in Vapi since 1996.", url: absoluteUrl("/catalog"), type: "website" },
};

export default async function CatalogPage() {
  const data = await getCatalogData();
  return <IndustrialFonts><IndustrialShell><Suspense fallback={<p style={{ padding: 36 }}>Loading product collection...</p>}><IndustrialCatalog {...data} /></Suspense></IndustrialShell></IndustrialFonts>;
}
