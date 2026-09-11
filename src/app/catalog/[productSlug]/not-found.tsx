import Link from "next/link";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import styles from "@/components/marketing/design-preview/catalog.module.css";

export default function ProductNotFound() {
  return <IndustrialFonts><IndustrialShell><section className={styles.empty}><span className={styles.eyebrow}>ExEC / PRODUCT COLLECTION</span><h1>This product isn’t available.</h1><p>The link may have changed, or the product is no longer in our collection.</p><Link href="/catalog">Explore the catalog ↗</Link></section></IndustrialShell></IndustrialFonts>;
}
