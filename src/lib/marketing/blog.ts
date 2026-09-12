import { cache } from "react";
import { prisma } from "@/lib/prisma/db";
import { posts as legacyPosts } from "@/lib/marketing/data";

export type PublicBlogPost = {
  id: string; slug: string; cat: string; date: string; publishedAt: Date; updatedAt: Date;
  read: string; image: string; imageAlt: string; title: string; excerpt: string; content: string;
  authorName: string; featured: boolean; seoTitle?: string | null; seoDescription?: string | null; keywords: string[];
};

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 210))} Min`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function legacy(): PublicBlogPost[] {
  return legacyPosts.map((post, index) => {
    const publishedAt = new Date(`${post.date} 12:00:00 GMT+0530`);
    return { id: `legacy-${post.slug}`, slug: post.slug, cat: post.cat, date: post.date, publishedAt, updatedAt: publishedAt, read: post.read, image: post.image, imageAlt: post.title, title: post.title, excerpt: post.excerpt, content: post.body.join("\n\n"), authorName: "ExEC Engineering Team", featured: index === 0, keywords: [] };
  });
}

export const getPublishedBlogPosts = cache(async (limit?: number): Promise<PublicBlogPost[]> => {
  const databasePosts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }] });
  const mapped: PublicBlogPost[] = databasePosts.map((post) => ({ id: post.id, slug: post.slug, cat: post.category, date: formatDate(post.publishedAt ?? post.createdAt), publishedAt: post.publishedAt ?? post.createdAt, updatedAt: post.updatedAt, read: readingTime(post.content), image: post.coverImage, imageAlt: post.coverImageAlt, title: post.title, excerpt: post.excerpt, content: post.content, authorName: post.authorName, featured: post.featured, seoTitle: post.seoTitle, seoDescription: post.seoDescription, keywords: post.keywords }));
  const dynamicSlugs = new Set(mapped.map((post) => post.slug));
  const combined = [...mapped, ...legacy().filter((post) => !dynamicSlugs.has(post.slug))];
  return limit ? combined.slice(0, limit) : combined;
});

export const getPublishedBlogPost = cache(async (slug: string): Promise<PublicBlogPost | null> => {
  const post = await prisma.blogPost.findFirst({ where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } } });
  if (post) return { id: post.id, slug: post.slug, cat: post.category, date: formatDate(post.publishedAt ?? post.createdAt), publishedAt: post.publishedAt ?? post.createdAt, updatedAt: post.updatedAt, read: readingTime(post.content), image: post.coverImage, imageAlt: post.coverImageAlt, title: post.title, excerpt: post.excerpt, content: post.content, authorName: post.authorName, featured: post.featured, seoTitle: post.seoTitle, seoDescription: post.seoDescription, keywords: post.keywords };
  return legacy().find((item) => item.slug === slug) ?? null;
});
