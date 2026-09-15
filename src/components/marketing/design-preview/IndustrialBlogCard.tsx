import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { BlogPreview } from "./BlogArchive";
import styles from "./blog.module.css";

export function IndustrialBlogCard({ post, index }: { post: BlogPreview; index: number }) {
  return <Link href={`/blog/${post.slug}`} className={styles.card}>
    <div className={styles.cardImage}>
      <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw" />
      <span className={styles.cardNumber} aria-hidden="true">{String(index).padStart(2, "0")}</span>
      <span className={styles.cardTopic}>{post.cat}</span>
    </div>
    <div className={styles.cardBody}>
      <div className={styles.meta}><span>{post.date}</span><span className={styles.metaRead}><Clock3 size={13} /> {post.read} read</span></div>
      <h3>{post.title}</h3><p>{post.excerpt}</p>
      <span className={styles.readLink}>Read article <ArrowUpRight size={16} /></span>
    </div>
  </Link>;
}
