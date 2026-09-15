import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Clock3 } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { BlogArchive } from "@/components/marketing/design-preview/BlogArchive";
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
  const featured = posts.find(post => post.featured) ?? posts[0];
  const previews = [...posts].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).map(({ slug, cat, date, read, image, imageAlt, title, excerpt }) => ({ slug, cat, date, read, image, imageAlt, title, excerpt }));

  return <IndustrialFonts><IndustrialShell><div className={styles.page}>
    <section className={styles.journalHeader} aria-labelledby="journal-title">
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Journal</span></nav>
      <div className={styles.journalMasthead}><div><span className={styles.eyebrow}>The ExEC engineering journal</span><h1 id="journal-title">From the workshop.<br /><span>For the field.</span></h1></div><div className={styles.journalIntro}><p>A closer look at the details that matter. Practical knowledge on flameproof equipment, hazardous areas and better engineering decisions.</p><a href="#latest-notes">Find your next read <ArrowDownRight size={19} /></a></div></div>
      <div className={styles.journalRule}><span>Engineering / Standards / Perspectives</span><span>{String(posts.length).padStart(2, "0")} articles & counting</span></div>
    </section>
    {featured && <section className={styles.featuredSection} aria-labelledby="featured-title"><Link href={`/blog/${featured.slug}`} className={styles.featured}>
      <div className={styles.featuredImage}><Image src={featured.image} alt={featured.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 52vw" /><span className={styles.imageIndex}>The editor’s pick</span></div>
      <div className={styles.featuredCopy}><div className={styles.meta}><span className={styles.categoryPill}>{featured.cat}</span><span className={styles.metaRead}><Clock3 size={14} /> {featured.read} read</span></div><h2 id="featured-title">{featured.title}</h2><p>{featured.excerpt}</p><div className={styles.featuredFooter}><span className={styles.readLink}>Read the story <ArrowUpRight size={18} /></span><span>{featured.date}</span></div></div>
    </Link></section>}
    <BlogArchive posts={previews} />
    <div className={styles.journalCta}><div><span className={styles.eyebrow}>Put knowledge into practice</span><h2>Have a specification in mind?</h2><p>Talk through your application with the people who build the equipment.</p></div><Link href="/contact" className={styles.outlineLink}>Talk to our team <ArrowUpRight size={18} /></Link></div>
  </div></IndustrialShell></IndustrialFonts>;
}
