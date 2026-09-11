import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import styles from "@/components/marketing/design-preview/catalog.module.css";

export default function CatalogLoading() {
  return <IndustrialFonts><IndustrialShell><section className={styles.empty} role="status"><span className={styles.eyebrow}>ExEC / PRODUCT COLLECTION</span><p>Preparing the collection…</p></section></IndustrialShell></IndustrialFonts>;
}
