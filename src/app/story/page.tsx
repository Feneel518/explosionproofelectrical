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
  title: "Our Story",
  description: "The story of Explosion Proof Electrical Control, designing and manufacturing flameproof electrical equipment in Vapi, Gujarat since 1996.",
  alternates: { canonical: "/story" },
  openGraph: {
    title: "Our Story | ExEC",
    description: "Rooted in Vapi since 1996. Built around the discipline hazardous-area safety demands.",
    url: absoluteUrl("/story"),
    type: "website",
  },
};

const values = [
  { title: "Containment first", text: "The protection concept comes before the product. Every enclosure begins with the responsibility to contain ignition." },
  { title: "Built with control", text: "Casting, machining, assembly and testing are brought together so critical interfaces receive consistent attention." },
  { title: "Direct accountability", text: "Customers speak with a team that stays close to the requirement from the first question through dispatch." },
];

const chapters = [
  { year: "1996", label: "The beginning", title: "A workshop in Vapi", text: "ExEC begins manufacturing flameproof electrical equipment for the industrial belt growing around Vapi, Gujarat." },
  { year: "2004", label: "The range develops", title: "Certified product families", text: "The catalogue expands around tested flameproof enclosures, lighting and connection equipment for hazardous areas." },
  { year: "2011", label: "More under one roof", title: "Panels join the floor", text: "Custom control and instrumentation panel fabrication adds a new layer of engineering around customer specifications." },
  { year: "Today", label: "The work continues", title: "Built for Indian industry", text: "Standard products and engineered builds leave Vapi with the same purpose: protecting people, assets and facilities." },
];

export default function StoryPage() {
  return (
    <IndustrialFonts>
      <IndustrialShell>
        <div className={styles.page}>
          <section className={styles.hero} aria-labelledby="story-title">
            <div className={styles.heroCopy}>
              <div className={styles.breadcrumbs}><Link href="/">Home</Link> / Our story</div>
              <div className={styles.heroTitle}>
                <span className={styles.eyebrow}>Since 1996 / Vapi, Gujarat</span>
                <h1 id="story-title">Rooted in Vapi. <span>Built to protect.</span></h1>
                <p>Nearly three decades of flameproof manufacturing, shaped by one enduring idea: in hazardous areas, the smallest detail can carry the greatest responsibility.</p>
              </div>
              <div className={styles.heroFoot}>
                <span>EXPLOSION PROOF ELECTRICAL CONTROL<br />ENGINEERED IN INDIA</span>
                <a href="#origin" className={styles.arrowLink}>Start the story <ArrowDownRight size={16} /></a>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <Image src={marketingAsset("factory.jpg")} alt="Industrial process plant representing the environments ExEC serves" fill priority sizes="(max-width: 900px) 100vw, 38vw" />
              <div className={styles.visualTag}><span>Archive / Vapi</span><span>Est. 1996</span></div>
              <span className={styles.visualNumber}>96</span>
            </div>
          </section>

          <section id="origin" aria-labelledby="origin-title">
            <div className={styles.sectionBar}><span>01 / The origin</span><span>A workshop / A purpose / A standard</span></div>
            <div className={styles.statement}>
              <h2 id="origin-title">The catalogue grew. <span>The rule did not change.</span></h2>
              <div className={styles.statementBody}>
                <p>ExEC started in 1996 in Vapi, at the centre of one of Gujarat’s most demanding industrial regions. The need was practical and urgent: electrical equipment that could perform in hazardous environments without becoming the source of ignition.</p>
                <p>Over time, the work expanded from cast enclosures and lighting to custom flameproof control and instrumentation panels. The responsibility behind every flame path stayed the same.</p>
              </div>
            </div>
          </section>

          <section className={styles.split} aria-labelledby="floor-title">
            <div className={`${styles.splitVisual} ${styles.product}`}>
              <Image src={marketingAsset("HumanStatic.png")} alt="Flameproof equipment on the ExEC production floor" fill sizes="(max-width: 900px) 100vw, 50vw" />
              <span className={styles.micro}>THE WORK IS INDUSTRIAL. THE RESPONSIBILITY IS HUMAN.</span>
            </div>
            <div className={styles.splitCopy}>
              <span className={styles.eyebrow}>02 / Under one roof</span>
              <h2 id="floor-title">Closer to the work. <span>Closer to the outcome.</span></h2>
              <p>Bringing casting, machining, assembly and testing together creates a shorter line between the drawing and the finished enclosure. It also creates clearer accountability when a specification needs attention.</p>
              <div className={styles.factList}>
                <div className={styles.fact}><span className={styles.index}>01</span><strong>Casting</strong><span>The enclosure begins</span></div>
                <div className={styles.fact}><span className={styles.index}>02</span><strong>Machining</strong><span>Critical interfaces take shape</span></div>
                <div className={styles.fact}><span className={styles.index}>03</span><strong>Assembly</strong><span>Components become a system</span></div>
                <div className={styles.fact}><span className={styles.index}>04</span><strong>Inspection</strong><span>The build meets the brief</span></div>
              </div>
            </div>
          </section>

          <section aria-labelledby="values-title">
            <div className={styles.sectionBar}><span>03 / What we stand on</span><span>The values under every casting</span></div>
            <div className={styles.statement}>
              <h2 id="values-title">Trust is earned <span>one build at a time.</span></h2>
              <div className={styles.statementBody}><p>Certification matters. So does the manufacturing judgement that turns an approved design into dependable equipment, again and again.</p></div>
            </div>
            <div className={styles.cardGrid}>
              {values.map((value, index) => (
                <article className={styles.card} key={value.title}>
                  <div className={styles.cardTop}><span className={styles.index}>[0{index + 1}]</span><span className={styles.cardIcon} aria-hidden="true" /></div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.timeline} aria-labelledby="timeline-title">
            <div className={styles.sectionBar}><span>04 / Chapters</span><span>1996 / Today</span></div>
            <div className={styles.timelineIntro}>
              <h2 id="timeline-title">Built over time.</h2>
              <p>The equipment has evolved with the industries it serves. The attention to containment, durability and field conditions remains the thread through every chapter.</p>
            </div>
            <div className={styles.timelineGrid}>
              {chapters.map((chapter) => (
                <article className={styles.chapter} key={chapter.year}>
                  <time>{chapter.year}</time>
                  <span className={styles.micro}>{chapter.label}</span>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.cta}>
            <div>
              <span className={styles.ctaLabel}>05 / The next chapter</span>
              <h2>Your requirement. <span>Our next build.</span></h2>
            </div>
            <div className={styles.ctaActions}>
              <p>Talk directly with the team about a certified product or a build around your application.</p>
              <Link href="/contact" className={styles.primaryAction}>Start a conversation <ArrowUpRight size={17} /></Link>
            </div>
          </section>
        </div>
      </IndustrialShell>
    </IndustrialFonts>
  );
}
