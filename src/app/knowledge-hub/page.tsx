import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Plus } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { KnowledgeLibrary } from "./KnowledgeLibrary";
import { knowledgeArticles } from "@/lib/marketing/knowledge";
import { absoluteUrl } from "@/lib/seo/site";
import styles from "./hub.module.css";

export const metadata: Metadata = {
  title: "Flameproof & Hazardous Area Knowledge Centre",
  description: "Understand hazardous-area zones, decode Ex markings and prepare a better equipment specification. Practical guides on flameproof protection, gas groups, cable glands and Indian approvals.",
  alternates: { canonical: "/knowledge-hub" },
  openGraph: {
    title: "Engineering Knowledge Centre | ExEC",
    description: "From the first Ex marking to a better equipment specification. A practical hazardous-area reference library.",
    url: absoluteUrl("/knowledge-hub"), type: "website",
  },
};

const learningPath = [
  { title: "Understand the area", text: "Begin with zones and what they tell you about the presence of an explosive gas atmosphere.", slug: "zone-0-zone-1-zone-2-hazardous-areas", label: "Start with hazardous zones" },
  { title: "Understand the protection", text: "Learn how a flameproof enclosure works and why its joints, entries and fasteners matter.", slug: "what-is-ex-d-flameproof-protection", label: "Explore Ex d protection" },
  { title: "Check the complete selection", text: "Bring the cable, enclosure and certificate together before choosing an entry device.", slug: "how-to-select-flameproof-cable-gland", label: "Use the gland checklist" },
];
const marking = [
  { code: "Ex", label: "Explosion protection", href: "what-is-ex-d-flameproof-protection" },
  { code: "db", label: "Flameproof · level b", href: "what-is-ex-d-flameproof-protection" },
  { code: "IIC", label: "Gas subgroup", href: "iia-iib-iic-gas-groups" },
  { code: "T4", label: "Temperature class", href: "temperature-classes-t1-to-t6" },
  { code: "Gb", label: "Equipment protection level", href: "zone-0-zone-1-zone-2-hazardous-areas" },
];

export default function KnowledgeHubPage() {
  const schema = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "Flameproof & Hazardous Area Knowledge Centre", description: metadata.description,
    url: absoluteUrl("/knowledge-hub"),
    hasPart: knowledgeArticles.map(article => ({ "@type": "TechArticle", headline: article.title, url: absoluteUrl(`/knowledge-hub/${article.slug}`) })),
  };
  const previews = knowledgeArticles.map(({ slug, shortTitle, category, description, readMinutes, takeaways }) => ({ slug, shortTitle, category, description, readMinutes, takeaways }));

  return <IndustrialFonts><IndustrialShell><div className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={styles.hero} aria-labelledby="knowledge-title">
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Knowledge centre</span></nav>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><span className={styles.statusDot} /> The ExEC engineering reference</span>
          <h1 id="knowledge-title">Know the hazard.<br /><span>Understand<br />the protection.</span></h1>
          <p>Make sense of hazardous areas, equipment markings and the details behind a sound specification. Practical reading for engineers, buyers and maintenance teams.</p>
          <a href="#guide-library" className={styles.primaryLink}>Explore the guides <ArrowDownRight size={18} /></a>
        </div>
        <div className={styles.referencePanel}>
          <div className={styles.panelTop}><span>Field reference / 001</span><BookOpen size={18} aria-hidden="true" /></div>
          <div className={styles.nameplate}>
            <span className={styles.plateLabel}>Anatomy of an Ex marking</span>
            <div className={styles.markingCode} aria-label="Example marking: Ex db IIC T4 Gb">{marking.map(item => <a key={item.code} href={`#marking-${item.code}`} aria-label={`Learn about ${item.code}: ${item.label}`}>{item.code}</a>)}</div>
            <span className={styles.plateCaption}>Illustrative gas-equipment marking</span>
            <i className={styles.screwOne} aria-hidden="true" /><i className={styles.screwTwo} aria-hidden="true" /><i className={styles.screwThree} aria-hidden="true" /><i className={styles.screwFour} aria-hidden="true" />
          </div>
          <div className={styles.markingKey}>{marking.map(item => <Link id={`marking-${item.code}`} href={`/knowledge-hub/${item.href}`} key={item.code}><strong>{item.code}</strong><span>{item.label}</span><ArrowUpRight size={14} aria-hidden="true" /></Link>)}</div>
          <p className={styles.panelNote}>Read every part together. The full certificate, ambient range and conditions of use complete the picture.</p>
          <a className={styles.sourceLink} href="https://www.iecex.com/assets/Uploads/D2S2-Ex-Protection-Techniques-BARTEC.pdf" target="_blank" rel="noopener noreferrer">Reference: IECEx marking guidance <ArrowUpRight size={12} /></a>
        </div>
      </div>
      <div className={styles.heroFoot}><span>Built for the questions that come before the purchase.</span><span>{String(knowledgeArticles.length).padStart(2, "0")} guides <i /> 04 topics <i /> One practical starting point</span></div>
    </section>
    <section className={styles.learning} aria-labelledby="learning-title">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>01 / Find your footing</span><h2 id="learning-title">New to hazardous areas? Start here.</h2></div><span className={styles.smallNote}>A suggested reading order</span></div>
      <div className={styles.learningGrid}>{learningPath.map((step, index) => <Link key={step.slug} href={`/knowledge-hub/${step.slug}`} className={styles.learningStep}><div className={styles.stepTop}><span>0{index + 1}</span><ArrowRight size={20} aria-hidden="true" /></div><h3>{step.title}</h3><p>{step.text}</p><span className={styles.stepLink}>{step.label}<ArrowUpRight size={15} aria-hidden="true" /></span></Link>)}</div>
    </section>
    <KnowledgeLibrary articles={previews} />
    <section className={styles.questions} aria-labelledby="questions-title">
      <div className={styles.questionIntro}><span className={styles.eyebrow}>03 / Clear up the essentials</span><h2 id="questions-title">Small questions.<br />Important distinctions.</h2><p>A few useful answers before you open a datasheet.</p></div>
      <div className={styles.accordion}>{[knowledgeArticles[0].faq[0], knowledgeArticles[1].faq[0], knowledgeArticles[3].faq[0], knowledgeArticles[5].faq[1]].map(item => <details key={item.question}><summary>{item.question}<Plus size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section className={styles.cta} aria-labelledby="support-title"><div><span className={styles.eyebrow}>From reference to real application</span><h2 id="support-title">Bring us your specification.</h2><p>Share your area classification, required marking and operating conditions. Our team can help you work through the equipment details.</p></div><Link className={styles.primaryLink} href="/contact">Talk to engineering <ArrowUpRight size={18} /></Link></section>
    <p className={styles.guidanceNote}>These guides support technical understanding. For a specific installation, use the product certificate, manufacturer instructions and applicable standards with a competent hazardous-area professional.</p>
  </div></IndustrialShell></IndustrialFonts>;
}
