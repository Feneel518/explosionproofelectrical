import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { PublicBlogPost } from "@/lib/marketing/blog";
import styles from "./blog.module.css";

export function IndustrialBlogCard({ post, index }: { post: PublicBlogPost; index: number }) {
  return <Link href={`/blog/${post.slug}`} className={styles.card}>
    <div className={styles.cardImage}>
      <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw" />
      <span className={styles.cardNumber}>{String(index).padStart(2, "0")}</span>
    </div>
    <div className={styles.cardBody}>
      <div className={styles.meta}><span className={styles.categoryPill}>{post.cat}</span><span>{post.date}</span><span className={styles.metaRead}><Clock3 size={12} /> {post.read} read</span></div>
      <h2>{post.title}</h2><p>{post.excerpt}</p>
      <span className={styles.readLink}>Read field note <ArrowUpRight size={15} /></span>
    </div>
  </Link>;
}
