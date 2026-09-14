import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { knowledgeArticles, knowledgeCategories } from "@/lib/marketing/knowledge";
import { absoluteUrl } from "@/lib/seo/site";
import styles from "./knowledge.module.css";

export const metadata: Metadata = {
  title: "Flameproof & Hazardous Area Knowledge Centre",
  description: "Practical engineering guides covering Ex d protection, hazardous-area zones, gas groups, temperature classes, cable gland selection and Indian compliance.",
  alternates: { canonical: "/knowledge-hub" },
  openGraph: {
    title: "Flameproof & Hazardous Area Knowledge Centre | ExEC",
    description: "Clear technical guidance for specifying explosion-protected electrical equipment.",
    url: absoluteUrl("/knowledge-hub"),
    type: "website",
  },
};

export default function KnowledgeHubPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Flameproof & Hazardous Area Knowledge Centre",
    description: metadata.description,
    url: absoluteUrl("/knowledge-hub"),
    hasPart: knowledgeArticles.map((article) => ({
      "@type": "TechArticle",
      headline: article.title,
      url: absoluteUrl(`/knowledge-hub/${article.slug}`),
    })),
  };

  return <IndustrialFonts><IndustrialShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={styles.hero}>
      <span className={styles.kicker}>ExEC / Engineering reference / Edition 01</span>
      <div className={styles.heroGrid}>
        <h1>Flameproof &amp;<br /><span>hazardous area</span><br />knowledge centre.</h1>
        <p>Clear, practical notes for engineers, buyers and maintenance teams selecting electrical equipment for explosive atmospheres.</p>
      </div>
    </section>
    <section className={styles.topics}>
      <aside className={styles.topicRail}>
        <span className={styles.kicker}>Browse topics</span>
        <p>Start with the hazard, understand the marking, then verify the complete certified arrangement.</p>
        <nav aria-label="Knowledge topics">{knowledgeCategories.map((category) => <a key={category} href={`#${category.toLowerCase().replaceAll(" ", "-")}`}>{category}<span>↘</span></a>)}</nav>
      </aside>
      <div className={styles.articleGrid}>
        {knowledgeArticles.map((article, index) => <article className={styles.card} id={article.category.toLowerCase().replaceAll(" ", "-")} key={article.slug}>
          <span className={styles.cardMeta}>{String(index + 1).padStart(2, "0")} / {article.category} / {article.readMinutes} min</span>
          <h2>{article.shortTitle}</h2>
          <p>{article.description}</p>
          <Link className={styles.cardLink} href={`/knowledge-hub/${article.slug}`}>Read technical guide <ArrowUpRight size={18} /></Link>
        </article>)}
      </div>
    </section>
    <section className={styles.cta}><strong>Need help matching a product to your specification?</strong><Link href="/#contact">Talk to engineering <ArrowUpRight size={17} /></Link></section>
  </IndustrialShell></IndustrialFonts>;
}
