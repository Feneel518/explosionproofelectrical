import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/marketing/BlogCard";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { getPublishedBlogPost, getPublishedBlogPosts } from "@/lib/marketing/blog";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";

interface ArticlePageProps { params: Promise<{ postSlug: string }>; }

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { postSlug } = await params;
  const post = await getPublishedBlogPost(postSlug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.keywords,
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
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt, image: [post.image], datePublished: post.publishedAt.toISOString(), dateModified: post.updatedAt.toISOString(), author: { "@type": "Organization", name: post.authorName }, publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") }, mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`) };

  return <MarketingShell active="blog">
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="relative flex min-h-[420px] items-end overflow-hidden border-b border-white/12">
        <Image src={post.image} alt={post.imageAlt} fill priority className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04121b] via-[#04121b]/75 to-[#04121b]/30" />
        <div className="relative px-5 py-12 sm:px-10 lg:px-[60px] lg:py-[74px]">
          <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.16em] text-white/60"><Link href="/" className="text-[#F17D1E]">Home</Link> &nbsp;/&nbsp; <Link href="/blog">Blog</Link></div>
          <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.18em] text-[#F17D1E]">{post.cat} / {post.date} / {post.read}</div>
          <h1 className="max-w-5xl font-[family-name:var(--font-marketing-display)] text-6xl uppercase leading-none sm:text-[84px]">{post.title}</h1>
        </div>
      </section>
      <section className="grid border-b border-white/12 lg:grid-cols-[0.74fr_1.26fr]">
        <aside className="border-r border-white/12 p-8 lg:p-[60px]"><div className="font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.16em] text-[#F17D1E]">Article Brief</div><p className="mt-5 text-base font-light leading-7 text-white/70">{post.excerpt}</p><p className="mt-6 text-xs uppercase tracking-[0.12em] text-white/45">By {post.authorName}</p><Link href="/blog" className="mt-8 inline-block border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">← Back to All Articles</Link></aside>
        <div className="p-8 lg:p-[60px]"><div className="max-w-3xl space-y-7 text-lg font-light leading-8 text-white/75"><ArticleContent content={post.content} /></div></div>
      </section>
    </article>
    {morePosts.length > 0 && <section><div className="px-5 py-14 sm:px-10 lg:px-[60px]"><h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[54px]">More Articles</h2></div><div className="grid md:grid-cols-2 xl:grid-cols-3">{morePosts.map((item) => <BlogCard key={item.slug} post={item} />)}</div></section>}
  </MarketingShell>;
}

function ArticleContent({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return <>{blocks.map((block, index) => {
    if (block.startsWith("## ")) return <h2 key={index} className="pt-5 font-[family-name:var(--font-marketing-display)] text-4xl uppercase leading-tight text-white">{block.slice(3)}</h2>;
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => line.startsWith("- "))) return <ul key={index} className="list-disc space-y-2 pl-6 marker:text-[#F17D1E]">{lines.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
    return <p key={index}>{block}</p>;
  })}</>;
}
