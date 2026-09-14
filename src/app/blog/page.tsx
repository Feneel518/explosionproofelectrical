import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { IndustrialBlogCard } from "@/components/marketing/design-preview/IndustrialBlogCard";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";
import styles from "@/components/marketing/design-preview/blog.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flameproof Engineering Blog",
  description: "Practical guides about hazardous-area classification, flameproof equipment, PESO and CIMFR certification, lighting, installation and maintenance.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const [featured, ...gridPosts] = posts;
  const categories = [...new Set(posts.map((post) => post.cat))];

  return <IndustrialFonts><IndustrialShell><div className={styles.page}>
    <section className={styles.journalHeader} aria-labelledby="journal-title">
      <div className={styles.journalTitle}>
        <div className={styles.breadcrumbs}><Link href="/">Home</Link> &nbsp;/&nbsp; Engineering journal</div>
        <span className={styles.issueMark}>Field notes / {String(posts.length).padStart(2, "0")}</span>
        <h1 id="journal-title">Practical knowledge for hazardous areas.</h1>
      </div>
      <div className={styles.journalIntro}>
        <span className={styles.eyebrow}>From the workshop / For the field</span>
        <p>Clear, practical notes on hazardous-area classification, flameproof protection, certification and maintenance—written for the people who specify, install and maintain the equipment.</p>
        <div className={styles.journalStats}>
          <span><strong>{String(posts.length).padStart(2, "0")}</strong> Field notes</span>
          <span><strong>{String(categories.length).padStart(2, "0")}</strong> Topics</span>
          <a href="#latest-notes">Browse the journal <ArrowDownRight size={16} /></a>
        </div>
      </div>
    </section>

    {featured ? <section className={styles.featuredSection} aria-labelledby="featured-title">
      <div className={styles.sectionBar}><span>Featured field note</span><span>Selected by ExEC engineering</span></div>
      <Link href={`/blog/${featured.slug}`} className={styles.featured}>
        <div className={styles.featuredImage}><Image src={featured.image} alt={featured.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 47vw" /><span className={styles.imageIndex}>01 / Featured</span></div>
        <div className={styles.featuredCopy}>
          <div className={styles.meta}><span className={styles.categoryPill}>{featured.cat}</span><span>{featured.date}</span><span className={styles.metaRead}><Clock3 size={12} /> {featured.read} read</span></div>
          <h2 id="featured-title">{featured.title}</h2><p>{featured.excerpt}</p>
          <span className={styles.readLink}>Open field note <ArrowUpRight size={16} /></span>
        </div>
      </Link>
    </section> : <div className={styles.empty}>Engineering notes are coming soon.</div>}

    {gridPosts.length > 0 && <section className={styles.archive} id="latest-notes" aria-labelledby="latest-notes-title">
      <div className={styles.archiveHeading}>
        <div><span className={styles.eyebrow}>The journal / Newest first</span><h2 id="latest-notes-title">Latest field notes</h2></div>
        <div className={styles.archiveCount}><BookOpen size={18} /><span>{String(gridPosts.length).padStart(2, "0")} more articles</span></div>
      </div>
      <div className={styles.archiveGrid}>{gridPosts.map((post, index) => <IndustrialBlogCard key={post.slug} post={post} index={index + 2} />)}</div>
    </section>}
  </div></IndustrialShell></IndustrialFonts>;
}
