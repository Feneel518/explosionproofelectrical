import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { getKnowledgeArticle, knowledgeArticles } from "@/lib/marketing/knowledge";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import styles from "../knowledge.module.css";

type Props = { params: Promise<{ articleSlug: string }> };

export function generateStaticParams() {
  return knowledgeArticles.map((article) => ({ articleSlug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getKnowledgeArticle((await params).articleSlug);
  if (!article) return { title: "Guide not found", robots: { index: false } };
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/knowledge-hub/${article.slug}` },
    openGraph: { title: `${article.title} | ExEC`, description: article.description, url: absoluteUrl(`/knowledge-hub/${article.slug}`), type: "article", modifiedTime: article.updatedAt },
  };
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const article = getKnowledgeArticle((await params).articleSlug);
  if (!article) notFound();
  const related = knowledgeArticles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const url = absoluteUrl(`/knowledge-hub/${article.slug}`);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: article.title, description: article.description, dateModified: article.updatedAt, datePublished: article.updatedAt, author: { "@type": "Organization", name: `${SITE_NAME} Engineering Team` }, publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") }, mainEntityOfPage: url },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Knowledge Centre", item: absoluteUrl("/knowledge-hub") },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ] },
      { "@type": "FAQPage", mainEntity: article.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };

  return <IndustrialFonts><IndustrialShell>
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className={styles.articleHero}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/knowledge-hub">Knowledge centre</Link><span>/</span><span aria-current="page">{article.shortTitle}</span></nav>
        <h1 className={styles.articleTitle}>{article.title}</h1>
        <div className={styles.meta}><span>{article.category}</span><span>{article.readMinutes} minute read</span><span>Reviewed {new Date(`${article.updatedAt}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
      </header>
      <section className={styles.answerLayout} aria-labelledby="short-answer"><div className={styles.answerLabel}><span className={styles.kicker} id="short-answer">The short answer</span></div><p className={styles.answer}>{article.answer}</p></section>
      <div className={styles.articleLayout}>
        <aside className={styles.toc}><span className={styles.kicker}>On this page</span><nav>{article.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}>{String(index + 1).padStart(2, "0")} / {section.heading}</a>)}<a href="#frequently-asked-questions">{String(article.sections.length + 1).padStart(2, "0")} / Questions</a></nav></aside>
        <div className={styles.content}>
          {article.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}><span className={styles.sectionIndex}>{String(index + 1).padStart(2, "0")} / Technical note</span><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
          <section className={styles.faq} id="frequently-asked-questions"><span className={styles.sectionIndex}>Questions / Direct answers</span><h2>Frequently asked questions</h2>{article.faq.map((item) => <div className={styles.faqItem} key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</section>
          <div className={styles.sources}><span className={styles.sourceLabel}>Primary references</span>{article.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</div>
          <p className={styles.disclaimer}>Technical guidance only. Always use the product certificate, manufacturer instructions, current applicable standards and a competent hazardous-area professional for a specific installation.</p>
        </div>
      </div>
    </article>
    <section className={styles.related}><span className={styles.kicker}>Continue learning</span><h2>Related technical guides</h2><div className={styles.relatedGrid}>{related.map((item) => <Link href={`/knowledge-hub/${item.slug}`} key={item.slug}><span className={styles.cardMeta}>{item.category}</span><strong>{item.title}</strong><ArrowUpRight size={18} /></Link>)}</div></section>
  </IndustrialShell></IndustrialFonts>;
}
