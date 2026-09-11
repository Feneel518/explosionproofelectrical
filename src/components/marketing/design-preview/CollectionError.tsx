"use client";

import { IndustrialFonts } from "./IndustrialFonts";
import { IndustrialShell } from "./IndustrialChrome";
import { COMPANY_EMAIL } from "@/lib/seo/site";
import styles from "./catalog.module.css";

export function CollectionError({ reset }: { reset: () => void }) {
  return <IndustrialFonts><IndustrialShell><section className={styles.empty}><span className={styles.eyebrow}>ExEC / PRODUCT COLLECTION</span><h1>We couldn’t load the collection.</h1><p>Please try again, or email our team for product specifications and availability.</p><button type="button" onClick={reset}>Try again</button><a href={`mailto:${COMPANY_EMAIL}`}>Email our team</a></section></IndustrialShell></IndustrialFonts>;
}
