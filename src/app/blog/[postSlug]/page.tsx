import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { ArticleTableOfContents, type ArticleSection } from "@/components/marketing/design-preview/ArticleTableOfContents";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { IndustrialBlogCard } from "@/components/marketing/design-preview/IndustrialBlogCard";
import { getPublishedBlogPost, getPublishedBlogPosts } from "@/lib/marketing/blog";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/blog.module.css";

interface ArticlePageProps { params: Promise<{ postSlug: string }>; }
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { postSlug } = await params;
  const post = await getPublishedBlogPost(postSlug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, url: `/blog/${post.slug}`, publishedTime: post.publishedAt.toISOString(), modifiedTime: post.updatedAt.toISOString(), authors: [post.authorName], images: [{ url: post.image, alt: post.imageAlt }] },
    twitter: { card: "summary_large_image", title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, images: [post.image] },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { postSlug } = await params;
  const post = await getPublishedBlogPost(postSlug);
  if (!post) notFound();
  const posts = await getPublishedBlogPosts();
  const morePosts = posts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const contentBlocks = parseArticleContent(post.content);
  const sections: ArticleSection[] = [
    { id: "article-overview", title: "Article overview" },
    ...contentBlocks.filter((block) => block.type === "heading").map((block) => ({ id: block.id!, title: block.text })),
  ];
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt, image: [post.image], datePublished: post.publishedAt.toISOString(), dateModified: post.updatedAt.toISOString(), author: { "@type": "Organization", name: post.authorName }, publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") }, mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`) };

  return <IndustrialFonts><IndustrialShell><div className={styles.page}>
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className={styles.articleHero} aria-labelledby="article-title">
        <div className={styles.articleHeroCopy}>
          <div className={styles.breadcrumbs}><Link href="/">Home</Link> &nbsp;/&nbsp; <Link href="/blog">Field notes</Link></div>
          <div className={styles.articleTitle}><div className={styles.meta}><span className={styles.categoryPill}>{post.cat}</span><span>{post.date}</span><span className={styles.metaRead}><Clock3 size={12} /> {post.read} read</span></div><h1 id="article-title">{post.title}</h1><p>{post.excerpt}</p></div>
          <div className={styles.articleByline}><span>By {post.authorName}</span><span>ExEC / Engineering journal</span></div>
        </div>
        <figure className={styles.articleHeroImage}><Image src={post.image} alt={post.imageAlt} fill priority sizes="(max-width: 980px) 100vw, 42vw" /><figcaption><span>Field note / {post.cat}</span><span>ExEC / {post.date}</span></figcaption></figure>
      </section>
      <section className={styles.articleLayout}>
        <aside className={styles.articleAside}>
          <div className={styles.articleAsideInner}>
            <ArticleTableOfContents sections={sections} />
            <Link href="/blog" className={styles.backLink}><ArrowLeft size={15} /> All field notes</Link>
          </div>
        </aside>
        <div className={styles.articleContent}>
          <span id="article-overview" className={styles.anchorTarget} aria-hidden="true" />
          <div className={styles.prose}><ArticleContent blocks={contentBlocks} /></div>
        </div>
      </section>
    </article>
    {morePosts.length > 0 && <section><div className={styles.moreHeading}><span className={styles.eyebrow}>Continue reading</span><h2>More field notes.</h2></div><div className={styles.archiveGrid}>{morePosts.map((item, index) => <IndustrialBlogCard key={item.slug} post={item} index={index + 1} />)}</div></section>}
  </div></IndustrialShell></IndustrialFonts>;
}

type ArticleBlock = { type: "heading" | "list" | "paragraph"; text: string; id?: string; lines?: string[] };

function parseArticleContent(content: string): ArticleBlock[] {
  const usedIds = new Map<string, number>();
  return content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean).map((block) => {
    if (block.startsWith("## ")) {
      const text = block.slice(3).trim();
      const baseId = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "section";
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);
      return { type: "heading", text, id: count ? `${baseId}-${count + 1}` : baseId };
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => line.startsWith("- "))) return { type: "list", text: block, lines: lines.map((line) => line.slice(2)) };
    return { type: "paragraph", text: block };
  });
}

function ArticleContent({ blocks }: { blocks: ArticleBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.type === "heading") return <h2 key={block.id} id={block.id}>{block.text}</h2>;
    if (block.type === "list") return <ul key={index}>{block.lines?.map((line) => <li key={line}>{line}</li>)}</ul>;
    return <p key={index}>{block.text}</p>;
  })}</>;
}
