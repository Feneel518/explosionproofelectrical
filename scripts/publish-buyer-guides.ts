import "dotenv/config";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { buyerGuidePosts } from "../src/lib/marketing/buyer-guide-posts";
import { posts as legacyPosts } from "../src/lib/marketing/data";
import { knowledgeArticles } from "../src/lib/marketing/knowledge";

const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !["--publish", "--dry-run"].includes(arg)) ||
    (args.has("--publish") && args.has("--dry-run"))) {
  throw new Error("Use --dry-run (default) or --publish.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const schema = new URL(process.env.DATABASE_URL).searchParams.get("schema") || "public";
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) throw new Error("Invalid database schema.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15_000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });

async function main() {
  const now = new Date();
  const [existingPosts, products, categories] = await Promise.all([
    prisma.blogPost.findMany(),
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null, category: { status: "ACTIVE", deletedAt: null } },
      select: { slug: true },
    }),
    prisma.category.findMany({ where: { status: "ACTIVE", deletedAt: null }, select: { slug: true } }),
  ]);
  const publicPaths = new Set([
    "/", "/catalog", "/blog", "/knowledge-hub", "/contact-us", "/about-us",
    ...products.map((p) => `/catalog/${p.slug}`),
    ...categories.map((c) => `/catalog/category/${c.slug}`),
    ...legacyPosts.map((p) => `/blog/${p.slug}`),
    ...knowledgeArticles.map((p) => `/knowledge-hub/${p.slug}`),
    ...existingPosts.filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= now).map((p) => `/blog/${p.slug}`),
    ...buyerGuidePosts.map((p) => `/blog/${p.slug}`),
  ]);
  assert.equal(buyerGuidePosts.length, 8);
  assert.equal(new Set(buyerGuidePosts.map((p) => p.slug)).size, buyerGuidePosts.length, "Duplicate slug");
  assert.equal(new Set(buyerGuidePosts.map((p) => p.keywords[0])).size, buyerGuidePosts.length, "Duplicate primary keyword");

  const checks = buyerGuidePosts.map((post) => {
    const words = post.content.trim().split(/\s+/).length;
    assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(words >= 550, `${post.slug}: expected a substantial article`);
    assert(post.seoTitle.length <= 65, `${post.slug}: title too long`);
    assert(post.seoDescription.length >= 110 && post.seoDescription.length <= 170, `${post.slug}: description length`);
    assert(post.keywords.length >= 3 && post.imageAlt, `${post.slug}: missing metadata`);
    assert(new Date(post.publishedAt) <= now, `${post.slug}: publication date is in the future`);
    assert(existsSync(path.join(process.cwd(), "public", post.image)), `${post.slug}: missing image`);
    const links = [...post.content.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g)].map((m) => m[1]);
    for (const href of links) assert(publicPaths.has(href), `${post.slug}: invalid link ${href}`);
    for (const category of post.relatedCategorySlugs) {
      assert(categories.some((c) => c.slug === category), `${post.slug}: invalid category ${category}`);
    }
    return { slug: post.slug, words, primaryKeyword: post.keywords[0], internalLinks: links.length };
  });
  console.table(checks);

  // Snapshot before writing; createMany never modifies an existing CMS record.
  const before = new Map(existingPosts.map((post) => [post.id, JSON.stringify(post)]));
  if (!args.has("--publish")) {
    console.log("Dry run passed. No records changed. Use --publish to create missing guides.");
    return;
  }
  const created = await prisma.$transaction(async (tx) => {
    const result = await tx.blogPost.createMany({
      skipDuplicates: true,
      data: buyerGuidePosts.map((post) => ({
        slug: post.slug, title: post.title, category: post.cat, excerpt: post.excerpt,
        content: post.content, coverImage: post.image, coverImageAlt: post.imageAlt,
        authorName: post.authorName, status: "PUBLISHED", featured: post.featured,
        publishedAt: now, seoTitle: post.seoTitle, seoDescription: post.seoDescription,
        keywords: post.keywords,
      })),
    });
    const after = await tx.blogPost.findMany({ where: { id: { in: [...before.keys()] } } });
    assert.equal(after.length, before.size, "An existing post was removed");
    for (const post of after) assert.equal(JSON.stringify(post), before.get(post.id), "Existing CMS content changed");
    return result.count;
  });
  const published = await prisma.blogPost.findMany({
    where: { slug: { in: buyerGuidePosts.map((p) => p.slug) } },
    select: { slug: true, status: true, publishedAt: true },
  });
  console.log(`Created ${created} guides. Preserved ${before.size} existing records unchanged.`);
  console.table(published);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
