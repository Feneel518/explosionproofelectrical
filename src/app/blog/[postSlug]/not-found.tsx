import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { SiteRoot } from "@/components/site/SiteRoot";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import styles from "@/components/marketing/design-preview/blog.module.css";

export default function ArticleNotFound() {
  return <SiteRoot><IndustrialShell><div className={styles.page}><section className={styles.empty}><BookOpen size={28} /><span className={styles.eyebrow}>The engineering journal / 404</span><h1>This article isn’t available.</h1><p>The link may have changed. There’s more to explore in the journal.</p><Link href="/blog" className={styles.outlineLink}>Browse all articles <ArrowUpRight size={17} /></Link></section></div></IndustrialShell></SiteRoot>;
}
