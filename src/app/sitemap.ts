import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await getPublishedBlogPosts();

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
    ...posts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
