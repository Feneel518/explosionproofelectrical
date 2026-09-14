import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { IndustrialShell } from "@/components/marketing/design-preview/IndustrialChrome";
import { marketingAsset } from "@/lib/marketing/data";
import { absoluteUrl } from "@/lib/seo/site";
import styles from "@/components/marketing/design-preview/public-pages.module.css";

export const metadata: Metadata = {
  title: "Flameproof Engineering",
  description: "See how ExEC approaches flameproof enclosure design, hazardous-area specifications, manufacturing and testing in Vapi, Gujarat.",
  alternates: { canonical: "/engineering" },
  openGraph: {
    title: "Flameproof Engineering | ExEC",
    description: "Hazardous-area equipment engineered around the real application—from specification through testing.",
    url: absoluteUrl("/engineering"),
    type: "website",
  },
};

const principles = [
  {
    title: "Containment first",
    text: "Flame paths, joints and fasteners are treated as one protection system—designed to contain an internal ignition and prevent flame transmission.",
  },
  {
    title: "Ingress controlled",
    text: "Sealing, cable entries and enclosure geometry are considered together so dust and water protection supports long-term equipment reliability.",
  },
  {
    title: "Heat accounted for",
    text: "Loads, ambient conditions and surface temperature limits inform the selection instead of being checked only after the enclosure is complete.",
  },
];

const process = [
  ["01", "Define the environment", "Zone, gas group, temperature class, ingress exposure and installation constraints establish the design boundary."],
  ["02", "Select or configure", "We match the requirement to a certified product family or define a custom control and instrumentation panel."],
  ["03", "Build with control", "Casting, machining, assembly and wiring are coordinated in Vapi with attention to interfaces and traceability."],
  ["04", "Inspect before dispatch", "The finished equipment is checked against the agreed specification before it leaves the floor."],
];

const industries = [
  { id: "oil-and-gas", title: "Oil & gas", text: "Lighting, control and connection equipment for classified process areas where robust containment is essential." },
  { id: "chemicals", title: "Chemicals", text: "Equipment selected around gas group, corrosive exposure, washdown and the realities of continuous process operations." },
  { id: "pharmaceuticals", title: "Pharmaceuticals", text: "Hazardous-area solutions for solvent handling and production spaces where cleanability and dependable sealing matter." },
  { id: "process-industries", title: "Process industries", text: "Practical flameproof equipment for utilities, material handling, coatings and other demanding industrial environments." },
];

export default function EngineeringPage() {
  return (
    <IndustrialFonts>
      <IndustrialShell>
        <div className={styles.page}>
          <section className={styles.hero} aria-labelledby="engineering-title">
            <div className={styles.heroCopy}>
              <div className={styles.breadcrumbs}><Link href="/">Home</Link> / Engineering</div>
              <div className={styles.heroTitle}>
                <span className={styles.eyebrow}>The engineering / Built into every detail</span>
                <h1 id="engineering-title">Designed around risk. <span>Built around reality.</span></h1>
                <p>Flameproof equipment does one serious job: it keeps an ignition inside the enclosure from becoming an event outside it. Every decision begins there.</p>
              </div>
              <div className={styles.heroFoot}>
                <span>ENGINEERED AND MANUFACTURED<br />IN VAPI, GUJARAT</span>
                <a href="#principles" className={styles.arrowLink}>See the approach <ArrowDownRight size={16} /></a>
              </div>
            </div>
            <div className={`${styles.heroVisual} ${styles.productVisual}`}>
              <Image src={marketingAsset("wellglass.png")} alt="ExEC flameproof wellglass light fitting" fill priority sizes="(max-width: 900px) 100vw, 38vw" />
              <div className={styles.visualTag}><span>Product study / 001</span><span>Not to scale</span></div>
              <span className={styles.visualNumber}>EX</span>
            </div>
          </section>

          <section id="principles" aria-labelledby="principles-title">
            <div className={styles.sectionBar}><span>01 / Engineering principles</span><span>Protection begins before production</span></div>
            <div className={styles.statement}>
              <h2 id="principles-title">Safety is not a feature. <span>It is the architecture.</span></h2>
              <div className={styles.statementBody}>
                <p>A hazardous-area product is only as dependable as the decisions behind its smallest interface. We begin with the application, then work inward—from the atmosphere and operating load to the enclosure, entries and assembly.</p>
                <p>That discipline applies whether the requirement is a standard fitting, a junction enclosure or a complete flameproof control panel.</p>
              </div>
            </div>
            <div className={styles.cardGrid}>
              {principles.map((principle, index) => (
                <article className={styles.card} key={principle.title}>
                  <div className={styles.cardTop}><span className={styles.index}>[0{index + 1}]</span><span className={styles.cardIcon} aria-hidden="true" /></div>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.split} aria-labelledby="process-title">
            <div className={`${styles.splitVisual} ${styles.product}`}>
              <Image src={marketingAsset("panel.png")} alt="ExEC flameproof control panel" fill sizes="(max-width: 900px) 100vw, 50vw" />
              <span className={styles.micro}>FROM SINGLE ENCLOSURES TO COMPLETE CONTROL AND INSTRUMENTATION PANELS</span>
            </div>
            <div className={styles.splitCopy}>
              <span className={styles.eyebrow}>02 / From brief to build</span>
              <h2 id="process-title">One team. <span>Every step.</span></h2>
              <p>A direct engineering conversation keeps the specification connected to the final equipment.</p>
              <div className={styles.factList}>
                {process.map(([number, title, text]) => (
                  <div className={styles.fact} key={number}>
                    <span className={styles.index}>{number}</span>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.industries} aria-labelledby="industries-title">
            <div className={styles.sectionBar}><span>03 / Made for the real world</span><span>Four environments / One standard of care</span></div>
            <div className={styles.statement}>
              <h2 id="industries-title">The drawing is the start. <span>The field is the test.</span></h2>
              <div className={styles.statementBody}><p>Temperature, dust, water, corrosion, maintenance access and operating duty all shape the right specification. The real environment belongs in the engineering conversation.</p></div>
            </div>
            <div className={styles.industryGrid}>
              {industries.map((industry, index) => (
                <article id={industry.id} className={styles.industry} data-number={`0${index + 1}`} key={industry.id}>
                  <span className={styles.eyebrow}>Application / 0{index + 1}</span>
                  <h3>{industry.title}</h3>
                  <p>{industry.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.cta}>
            <div>
              <span className={styles.ctaLabel}>04 / Start with the requirement</span>
              <h2>Bring the challenge. <span>We’ll bring the engineering.</span></h2>
            </div>
            <div className={styles.ctaActions}>
              <p>Share the zone, gas group, load, quantity or drawing you already have. We will help define the next step.</p>
              <Link href="/contact" className={styles.primaryAction}>Talk to engineering <ArrowUpRight size={17} /></Link>
            </div>
          </section>
        </div>
      </IndustrialShell>
    </IndustrialFonts>
  );
}
