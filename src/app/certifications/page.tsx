import type { Metadata } from "next";
import Link from "next/link";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, COMPANY_EMAIL } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/catalog.module.css";

export const metadata: Metadata = { title: "Flameproof Certification & Approval Documents", description: "Verify the certificate and approval scope for your ExEC product configuration. Review IECEx and PESO primary references and request model-specific documentation.", alternates: { canonical: "/certifications" } };
const references = [
  { name: "IECEx online certificate system", url: "https://www.iecex.com/certificates/" },
  { name: "PESO procedure for Ex electrical apparatus", url: "https://www.peso.gov.in/web/en/sop-approval-ex-electrical-apparatus-installed-hazardous-areas" },
  { name: "PESO flameproof equipment FAQs", url: "https://www.peso.gov.in/web/index.php/en/node/297" },
];

export default function CertificationsPage() {
  return <IndustrialFonts><IndustrialShell>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "ExEC Certification and Approval Documents", url: absoluteUrl("/certifications"), publisher: { "@id": absoluteUrl("/#organization") }, about: { "@type": "Thing", name: "Explosion-protection certificate verification" } }} />
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">Certification documents</span></nav>
    <section className={styles.categoryHero}><span className={styles.eyebrow}>ExEC / TECHNICAL DOCUMENTATION</span><div><h1>Verify the marking.<br /><span>Check the scope.</span></h1><p>A certificate applies to defined equipment and conditions. Request the documents for the exact model and configuration you intend to install.</p></div></section>
    <section className={styles.selectionContent}><h2>Request model-specific documents</h2><p>Model-specific certificates and approvals are available on request from our team. Send the catalog product name, type number, selected configuration and installation requirements so we can identify the documentation relevant to your enquiry.</p><nav className={styles.resourceLinks}><a href={`mailto:${COMPANY_EMAIL}?subject=Model-specific%20certificate%20request`}>Request certificate documents</a><Link href="/catalog">Find product and type number</Link><Link href="/contact">Contact engineering</Link></nav></section>
    <section className={styles.selectionContent}><h2>What to check in the supplied documents</h2><ul><li>Manufacturer name, certificate number and covered type numbers</li><li>Full Ex marking, gas or dust group and permitted EPL / zones</li><li>Temperature class, ambient range and electrical ratings</li><li>Certificate schedules, drawings and special conditions of use</li><li>Approval validity and applicability to the installation jurisdiction</li><li>Consistency between the certificate, nameplate and supplied configuration</li></ul><p>A test report, product certificate, BIS licence and statutory approval perform different functions. Verify the documents required by the product and the installation, rather than treating one document as a blanket approval for the complete catalog.</p></section>
    <section className={styles.selectionContent}><h2>Primary verification references</h2><p>These are authority references for document review. They do not represent a claim that every ExEC product holds an IECEx certificate or a particular statutory approval.</p><nav className={styles.resourceLinks} aria-label="Certification authority references">{references.map(reference => <a key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer">{reference.name}</a>)}</nav><nav className={styles.resourceLinks}><Link href="/knowledge-hub/flameproof-certification-india">Certification requirements in India</Link><Link href="/knowledge-hub/equipment-protection-levels-ga-gb-gc">Understand equipment protection levels</Link></nav></section>
  </IndustrialShell></IndustrialFonts>;
}
