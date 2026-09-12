import { IndustrialHome } from "@/components/marketing/design-preview/IndustrialHome";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { getCatalogData } from "@/lib/marketing/catalog";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ products }, blogPosts] = await Promise.all([getCatalogData(), getPublishedBlogPosts(3)]);
  return <IndustrialFonts><IndustrialHome products={products} blogPosts={blogPosts} /></IndustrialFonts>;
}
