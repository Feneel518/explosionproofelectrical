import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";
import { getCatalogIndexEntries } from "@/lib/marketing/catalog";
import { knowledgeArticles } from "@/lib/marketing/knowledge";
import { categoryLandings } from "@/lib/seo/categories";
import { industryPages } from "@/lib/seo/industries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, catalog] = await Promise.all([getPublishedBlogPosts(), getCatalogIndexEntries()]);
  const contentUpdated = new Date("2026-09-16T00:00:00+05:30");
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/catalog"), changeFrequency: "weekly", priority: 0.95 },
    { url: absoluteUrl("/gallery"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/story"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/engineering"), changeFrequency: "monthly", priority: 0.85 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/industries"), lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.85 },
    { url: absoluteUrl("/certifications"), lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.85 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/knowledge-hub"), changeFrequency: "weekly", priority: 0.95 },
    ...catalog.categories.map((category) => ({ url: absoluteUrl(`/catalog/category/${category.slug}`), lastModified: category.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...categoryLandings.map(category => ({ url: absoluteUrl(`/catalog/category/${category.slug}`), lastModified: contentUpdated, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...industryPages.map(industry => ({ url: absoluteUrl(`/industries/${industry.slug}`), lastModified: contentUpdated, changeFrequency: "monthly" as const, priority: 0.85 })),
    ...catalog.products.map((product) => ({ url: absoluteUrl(`/catalog/${product.slug}`), lastModified: new Date(Math.max(product.updatedAt.getTime(), contentUpdated.getTime())), changeFrequency: "weekly" as const, priority: 0.9 })),
    ...knowledgeArticles.map((article) => ({ url: absoluteUrl(`/knowledge-hub/${article.slug}`), lastModified: new Date(`${article.updatedAt}T00:00:00+05:30`), changeFrequency: "monthly" as const, priority: 0.85 })),
    ...posts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
  return [...new Map(entries.map(entry => [entry.url, entry])).values()];
}
