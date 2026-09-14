import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";
import { getCatalogIndexEntries } from "@/lib/marketing/catalog";
import { knowledgeArticles } from "@/lib/marketing/knowledge";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [posts, catalog] = await Promise.all([getPublishedBlogPosts(), getCatalogIndexEntries()]);

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/catalog"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/gallery"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about-us"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/contact-us"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/knowledge-hub"), lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    ...catalog.categories.map((category) => ({ url: absoluteUrl(`/catalog/category/${category.slug}`), lastModified: category.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...catalog.products.map((product) => ({ url: absoluteUrl(`/catalog/${product.slug}`), lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...knowledgeArticles.map((article) => ({ url: absoluteUrl(`/knowledge-hub/${article.slug}`), lastModified: new Date(`${article.updatedAt}T00:00:00+05:30`), changeFrequency: "monthly" as const, priority: 0.85 })),
    ...posts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
