import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { editorialBlogPosts } from "../src/lib/marketing/editorial-blog-posts";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the blog posts.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  for (const post of editorialBlogPosts) {
    const publishedAt = new Date(post.publishedAt);
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true, coverImage: true },
    });

    const saved = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.cat,
        coverImage: post.image,
        coverImageAlt: post.imageAlt,
        authorName: post.authorName,
        status: "PUBLISHED",
        featured: post.featured,
        publishedAt,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        keywords: post.keywords,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.cat,
        coverImageAlt: post.imageAlt,
        authorName: post.authorName,
        status: "PUBLISHED",
        featured: post.featured,
        publishedAt,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        keywords: post.keywords,
      },
      select: { id: true, slug: true, title: true, status: true, featured: true, coverImage: true },
    });

    const action = existing ? "updated" : "created";
    const imageNote = existing ? "existing cover preserved" : "placeholder cover added";
    console.log(`${action}: ${saved.title} (${saved.slug}) — ${imageNote}`);
  }

  const seeded = await prisma.blogPost.findMany({
    where: { slug: { in: editorialBlogPosts.map((post) => post.slug) } },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, status: true, featured: true, coverImage: true },
  });

  console.log(`Seed complete: ${seeded.length}/${editorialBlogPosts.length} blog posts are present.`);
  console.table(seeded);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
