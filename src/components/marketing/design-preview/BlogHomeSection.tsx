import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { PublicBlogPost } from "@/lib/marketing/blog";
import styles from "./blog.module.css";

export function BlogHomeSection({ posts }: { posts: PublicBlogPost[] }) {
  const [featured, ...latest] = posts;

  return <section id="blog" className={`${styles.page} ${styles.homeSection}`} aria-labelledby="home-blog-title">
    <div className={styles.sectionBar}><span>05 / The engineering journal</span><span>From the workshop. For the field.</span></div>
    <div className={styles.homeHeading}>
      <div><span className={styles.eyebrow}>Knowledge that works</span><h2 id="home-blog-title">Better informed.<br /><span>Better engineered.</span></h2></div>
      <div><p>Practical perspectives on the equipment, standards and decisions that make hazardous areas safer.</p><Link href="/blog" className={styles.outlineLink}>Explore the journal <ArrowUpRight size={18} /></Link></div>
    </div>
    {featured ? <div className={styles.homeGrid}>
      <Link href={`/blog/${featured.slug}`} className={styles.homeFeature}>
        <div className={styles.homeFeatureImage}><Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 760px) 100vw, 55vw" /><span className={styles.imageIndex}>In focus / {featured.cat}</span></div>
        <div className={styles.homeFeatureCopy}><div className={styles.meta}><span>{featured.date}</span><span>{featured.read} read</span></div><h3>{featured.title}</h3><p>{featured.excerpt}</p><span className={styles.readLink}>Read article <ArrowUpRight size={17} /></span></div>
      </Link>
      {latest.length > 0 && <div className={styles.homeLatest}><div className={styles.homeLatestLabel}><BookOpen size={16} /><span>More from the journal</span></div>{latest.slice(0, 2).map((post, index) => <Link href={`/blog/${post.slug}`} key={post.slug} className={styles.homeNote}>
        <div className={styles.homeNoteCopy}><div className={styles.meta}><span className={styles.topic}>{post.cat}</span><span>{post.read} read</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><span className={styles.readLink}>Read article <ArrowUpRight size={16} /></span></div>
        <div className={styles.homeNoteImage}><Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 480px) 90px, 160px" /><span aria-hidden="true">0{index + 2}</span></div>
      </Link>)}</div>}
    </div> : <div className={styles.empty}><BookOpen size={28} /><h3>Good things are in the works.</h3><p>Our engineering notes will be available here soon.</p></div>}
  </section>;
}
