"use client";

import { useMemo, useState } from "react";
import { ArrowDown, Search, X } from "lucide-react";
import type { PublicBlogPost } from "@/lib/marketing/blog";
import { IndustrialBlogCard } from "./IndustrialBlogCard";
import styles from "./blog.module.css";

export type BlogPreview = Pick<PublicBlogPost, "slug" | "cat" | "date" | "read" | "image" | "imageAlt" | "title" | "excerpt">;
const PAGE_SIZE = 6;

export function BlogArchive({ posts }: { posts: BlogPreview[] }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const categories = useMemo(() => [...new Set(posts.map(post => post.cat))].sort(), [posts]);
  const filtered = posts.filter(post => (!category || post.cat === category) && `${post.title} ${post.excerpt} ${post.cat}`.toLowerCase().includes(query.trim().toLowerCase()));
  const reset = () => { setCategory(""); setQuery(""); setVisibleCount(PAGE_SIZE); };

  return <section className={styles.archive} id="latest-notes" aria-labelledby="latest-notes-title">
    <div className={styles.archiveHeading}><div><span className={styles.eyebrow}>Explore / Learn / Apply</span><h2 id="latest-notes-title">The knowledge behind the work.</h2></div><label className={styles.search}><Search size={18} aria-hidden="true" /><span className={styles.srOnly}>Search articles</span><input type="search" placeholder="Search the journal…" value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} />{query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); setVisibleCount(PAGE_SIZE); }}><X size={16} /></button>}</label></div>
    <div className={styles.filterBar}><div className={styles.filters} role="group" aria-label="Filter articles by topic"><button type="button" aria-pressed={!category} onClick={() => { setCategory(""); setVisibleCount(PAGE_SIZE); }}>All articles <span>{posts.length}</span></button>{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => { setCategory(item); setVisibleCount(PAGE_SIZE); }}>{item}</button>)}</div><span className={styles.resultCount} role="status">{filtered.length} {filtered.length === 1 ? "article" : "articles"}</span></div>
    {filtered.length ? <div className={styles.archiveGrid}>{filtered.slice(0, visibleCount).map((post, index) => <IndustrialBlogCard key={post.slug} post={post} index={index + 1} />)}</div> : <div className={styles.empty}><Search size={28} /><h3>No articles found</h3><p>Try a different keyword or explore another topic.</p><button type="button" className={styles.outlineLink} onClick={reset}>Clear filters <X size={16} /></button></div>}
    {filtered.length > visibleCount && <div className={styles.loadMore}><span>Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} articles</span><button type="button" className={styles.outlineLink} onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>Load more articles <ArrowDown size={16} /></button></div>}
  </section>;
}
