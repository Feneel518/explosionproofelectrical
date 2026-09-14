import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  const contentHtml = isHtmlContent(post.content);
  const contentBlocks = contentHtml ? [] : parseArticleContent(post.content);
  const sections: ArticleSection[] = [
    { id: "article-overview", title: "Article overview" },
    ...contentBlocks.filter((block) => block.type === "heading").map((block) => ({ id: block.id!, title: block.text })),
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, image: [absoluteUrl(post.image)], datePublished: post.publishedAt.toISOString(), dateModified: post.updatedAt.toISOString(), author: { "@type": "Organization", name: post.authorName, url: absoluteUrl("/story") }, publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/"), logo: { "@type": "ImageObject", url: absoluteUrl("/asset/shortLogo.png") } }, mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${post.slug}`) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) },
    ] },
  ];

  return <IndustrialFonts><IndustrialShell><div className={styles.page}>
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className={styles.articleHero} aria-labelledby="article-title">
        <div className={styles.articleHeroCopy}>
          <div className={styles.breadcrumbs}><Link href="/">Home</Link> &nbsp;/&nbsp; <Link href="/blog">Field notes</Link></div>
          <div className={styles.articleTitle}><div className={styles.meta}><span className={styles.categoryPill}>{post.cat}</span><span>{post.date}</span><span className={styles.metaRead}><Clock3 size={12} /> {post.read} read</span></div><h1 id="article-title">{post.title}</h1><p>{post.excerpt}</p></div>
          <div className={styles.articleByline}><span>By {post.authorName}</span><span>Hazardous-area equipment manufacturer / Vapi, Gujarat</span><span>Content reviewed {post.date}</span></div>
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
          {contentHtml ? <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.content }} /> : <div className={styles.prose}><ArticleContent blocks={contentBlocks} /></div>}
        </div>
      </section>
    </article>
    {morePosts.length > 0 && <section><div className={styles.moreHeading}><span className={styles.eyebrow}>Continue reading</span><h2>More field notes.</h2></div><div className={styles.archiveGrid}>{morePosts.map((item, index) => <IndustrialBlogCard key={item.slug} post={item} index={index + 1} />)}</div></section>}
  </div></IndustrialShell></IndustrialFonts>;
}

type ArticleBlock =
  | { type: "heading"; text: string; id: string; level: 2 | 3 }
  | { type: "list"; lines: string[]; ordered: boolean }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "paragraph"; text: string };

function parseArticleContent(content: string): ArticleBlock[] {
  const usedIds = new Map<string, number>();
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];

  const makeId = (text: string) => {
    const baseId = stripMarkdown(text).toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "section";
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    return count ? `${baseId}-${count + 1}` : baseId;
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({ type: "heading", text, id: makeId(text), level: heading[1].length as 2 | 3 });
      index += 1;
      continue;
    }

    if (line.startsWith("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const unordered = /^[-*]\s+/.test(line);
    const ordered = /^\d+\.\s+/.test(line);
    if (unordered || ordered) {
      const listLines: string[] = [];
      const matcher = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (index < lines.length && matcher.test(lines[index].trim())) {
        listLines.push(lines[index].trim().replace(matcher, ""));
        index += 1;
      }
      blocks.push({ type: "list", lines: listLines, ordered });
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      const next = lines[index].trim();
      if (/^(#{2,3})\s+/.test(next) || /^[-*]\s+/.test(next) || /^\d+\.\s+/.test(next) || (next.startsWith("|") && index + 1 < lines.length && isTableDivider(lines[index + 1]))) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function ArticleContent({ blocks }: { blocks: ArticleBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.type === "heading") {
      return block.level === 3
        ? <h3 key={block.id} id={block.id}>{renderInline(block.text)}</h3>
        : <h2 key={block.id} id={block.id}>{renderInline(block.text)}</h2>;
    }
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={index}>{block.lines.map((line, lineIndex) => <li key={`${lineIndex}-${line}`}>{renderInline(line)}</li>)}</List>;
    }
    if (block.type === "table") return <div className={styles.tableScroll} key={index}><table><thead><tr>{block.headers.map((cell, cellIndex) => <th key={`${cellIndex}-${cell}`}>{renderInline(cell)}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{renderInline(cell)}</td>)}</tr>)}</tbody></table></div>;
    return <p key={index}>{renderInline(block.text)}</p>;
  })}</>;
}

function splitTableRow(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function stripMarkdown(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "");
}

function isHtmlContent(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return tokens.map((token, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/")) return <Link href={href} key={index}>{label}</Link>;
      if (href.startsWith("https://")) return <a href={href} key={index} target="_blank" rel="noopener noreferrer">{label}</a>;
      return <span key={index}>{token}</span>;
    }
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index}>{token.slice(1, -1)}</code>;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={index}>{token.slice(1, -1)}</em>;
    return <span key={index}>{token}</span>;
  });
}
