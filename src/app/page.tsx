import { IndustrialHome } from "@/components/marketing/design-preview/IndustrialHome";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { getCatalogData } from "@/lib/marketing/catalog";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";
import type { Metadata } from "next";
import { absoluteUrl, SITE_DESCRIPTION, SITE_TITLE_DEFAULT } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE_DEFAULT }, description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: SITE_TITLE_DEFAULT, description: SITE_DESCRIPTION, url: absoluteUrl("/"), type: "website" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ products }, blogPosts] = await Promise.all([getCatalogData(), getPublishedBlogPosts(3)]);
  return <IndustrialFonts><IndustrialHome products={products} blogPosts={blogPosts} /></IndustrialFonts>;
}
