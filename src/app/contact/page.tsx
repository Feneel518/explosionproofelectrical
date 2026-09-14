import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { ContactForm } from "@/components/marketing/ContactForm";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { getQuoteProductOptions } from "@/lib/marketing/quoteProductOptions";
import { marketingAsset } from "@/lib/marketing/data";
import { absoluteUrl, COMPANY_ADDRESS, COMPANY_EMAIL } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/public-pages.module.css";

export const metadata: Metadata = {
  title: "Contact ExEC",
  description: "Contact ExEC in Vapi, Gujarat for flameproof product selection, quotations, technical support and custom hazardous-area panel requirements.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact ExEC",
    description: "Share your hazardous-area requirement with the ExEC sales and engineering team.",
    url: absoluteUrl("/contact"),
    type: "website",
  },
};

export default async function ContactPage() {
  const productOptions = await getQuoteProductOptions();

  return (
    <IndustrialFonts>
      <IndustrialShell>
        <div className={styles.page}>
          <section className={styles.hero} aria-labelledby="contact-title">
            <div className={styles.heroCopy}>
              <div className={styles.breadcrumbs}><Link href="/">Home</Link> / Contact</div>
              <div className={styles.heroTitle}>
                <span className={styles.eyebrow}>Your next project / Start here</span>
                <h1 id="contact-title">Bring the challenge. <span>We’ll bring the engineering.</span></h1>
                <p>Send the zone, gas group, load, quantity or drawing you already have. If the brief is still taking shape, send the question—we will help you find the right starting point.</p>
              </div>
              <div className={styles.heroFoot}>
                <span>SALES / PRODUCT SELECTION<br />CUSTOM PANEL REQUIREMENTS</span>
                <a href="#enquiry" className={styles.arrowLink}>Send a requirement <ArrowDownRight size={16} /></a>
              </div>
            </div>
            <div className={`${styles.heroVisual} ${styles.productVisual}`}>
              <Image src={marketingAsset("gujarat.png")} alt="Map marking ExEC in Vapi, Gujarat" fill priority sizes="(max-width: 900px) 100vw, 38vw" />
              <div className={styles.visualTag}><span>Vapi / Gujarat</span><span>20.3893° N</span></div>
              <span className={styles.visualNumber}>IN</span>
            </div>
          </section>

          <section id="enquiry" aria-labelledby="enquiry-title">
            <div className={styles.sectionBar}><span>01 / Send a requirement</span><span>Sales / Engineering / Support</span></div>
            <div className={styles.contactGrid}>
              <div className={styles.formPanel}>
                <span className={styles.eyebrow}>Tell us what you are working on</span>
                <h2 id="enquiry-title">The useful details. <span>All in one place.</span></h2>
                <ContactForm productOptions={productOptions} />
              </div>
              <aside className={styles.contactAside} aria-label="Contact information">
                <div className={styles.contactCard}>
                  <span className={styles.factLabel}>Factory & office</span>
                  <strong>{COMPANY_ADDRESS.streetAddress}</strong>
                  <address>{COMPANY_ADDRESS.addressLocality}, {COMPANY_ADDRESS.addressRegion} {COMPANY_ADDRESS.postalCode}<br />India</address>
                </div>
                <div className={styles.contactCard}>
                  <span className={styles.factLabel}>Email</span>
                  <strong><a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a></strong>
                  <p>Product enquiries, quotations, engineering questions and after-sales support.</p>
                </div>
                <div className={styles.contactCard}>
                  <span className={styles.factLabel}>Helpful with your enquiry</span>
                  <strong>Zone / Gas group / Load / Quantity</strong>
                  <p>Attach or reference an existing drawing, datasheet or approved specification in your message when available.</p>
                </div>
                <div className={styles.contactCard}>
                  <span className={styles.factLabel}>Product collection</span>
                  <strong><Link href="/catalog">Browse the ExEC catalog →</Link></strong>
                  <p>Review the current product range before sending your requirement.</p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </IndustrialShell>
    </IndustrialFonts>
  );
}
