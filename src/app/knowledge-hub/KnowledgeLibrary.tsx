"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Search, X } from "lucide-react";
import { knowledgeCategories, type KnowledgeArticle } from "@/lib/marketing/knowledge";
import styles from "./hub.module.css";

type Preview = Pick<KnowledgeArticle, "slug" | "shortTitle" | "category" | "description" | "readMinutes" | "takeaways">;
const symbols: Record<string, string> = {
  "what-is-ex-d-flameproof-protection": "Ex d",
  "zone-0-zone-1-zone-2-hazardous-areas": "Z0 / Z1 / Z2",
  "iia-iib-iic-gas-groups": "IIA → IIC",
  "temperature-classes-t1-to-t6": "T1 — T6",
  "how-to-select-flameproof-cable-gland": "M / NPT",
  "flameproof-equipment-certification-india": "BIS / PESO",
};

export function KnowledgeLibrary({ articles }: { articles: Preview[] }) {
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = articles.filter(article => (!category || article.category === category) && terms.every(term => `${article.shortTitle} ${article.category} ${article.description} ${article.takeaways.join(" ")} ${symbols[article.slug]}`.toLowerCase().includes(term)));
  const reset = () => { setCategory(""); setQuery(""); };

  return <section className={styles.library} id="guide-library" aria-labelledby="library-title">
    <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>02 / The reference library</span><h2 id="library-title">A little clarity. A better decision.</h2><p>Find the concept, comparison or checklist you need.</p></div><label className={styles.search}><Search size={18} aria-hidden="true" /><span className={styles.srOnly}>Search technical guides</span><input type="search" placeholder="Try ‘gas groups’ or ‘cable’" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={17} /></button>}</label></div>
    <div className={styles.filterBar}><div className={styles.filters} role="group" aria-label="Filter guides by topic">{["", ...knowledgeCategories].map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item || "All guides"}<span>{item ? articles.filter(article => article.category === item).length : articles.length}</span></button>)}</div><span className={styles.resultCount} role="status">{filtered.length} {filtered.length === 1 ? "guide" : "guides"}</span></div>
    {filtered.length ? <div className={styles.articleGrid}>{filtered.map(article => <article className={styles.card} key={article.slug}>
      <Link href={`/knowledge-hub/${article.slug}`} className={styles.cardAnchor}>
        <div className={styles.cardVisual} aria-hidden="true"><span>REF / {String(articles.indexOf(article) + 1).padStart(2, "0")}</span><strong>{symbols[article.slug]}</strong><ArrowUpRight size={24} /></div>
        <div className={styles.cardBody}><div className={styles.cardMeta}><span>{article.category}</span><span><Clock3 size={13} aria-hidden="true" />{article.readMinutes} min</span></div><h3>{article.shortTitle}</h3><p>{article.description}</p><ul aria-label="Inside this guide">{article.takeaways.map(item => <li key={item}>{item}</li>)}</ul><span className={styles.cardLink}>Read the guide <ArrowUpRight size={18} aria-hidden="true" /></span></div>
      </Link>
    </article>)}</div> : <div className={styles.empty}><Search size={30} aria-hidden="true" /><h3>No matching guides</h3><p>Try a broader term, such as “zone”, “temperature” or “gland”, or clear your topic filter.</p><button type="button" onClick={reset}>Show all guides <X size={16} /></button></div>}
  </section>;
}
