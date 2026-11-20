"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, FileText, Mail } from "lucide-react";
import { marketingAsset } from "@/lib/marketing/data";
import { productExperience } from "@/lib/marketing/productExperience";
import { COMPANY_EMAIL } from "@/lib/seo/site";
import { RequestQuoteModal } from "@/components/marketing/RequestQuoteModal";
import { CountUp, Marquee, Parallax, Reveal, RevealLines, ScrollLitText, Stagger, scrollToTarget } from "@/components/site/motion";
import { ProductDiagram, diagramFor, type DiagramKind } from "@/components/site/ProductDiagram";
import { IndustrialShell } from "./IndustrialChrome";
import type { CatalogFilterOption, CatalogProductCard } from "@/lib/marketing/catalog";
import { certificateChecklist, certificationBodies } from "@/lib/marketing/certificates";
import { CatalogCard } from "./CatalogCard";
import type { PublicBlogPost } from "@/lib/marketing/blog";
import styles from "./home.module.css";

const INK = "#041a2a";
const EASE = [0.22, 1, 0.36, 1] as const;

const ProductStage = dynamic(() => import("./ProductStage"), { ssr: false, loading: () => null });

/** A still of the model's starting pose, rendered from the same GLB (see public/models). */
const MODEL_POSTER = "/models/exec-wellglass-45w-poster.webp";

/** Start the 3D model once the page is idle, and not at all when the visitor asked to save data. */
function useDeferred3D() {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;
    const start = () => setLoad(true);
    if (typeof window.requestIdleCallback === "function") { const id = window.requestIdleCallback(start, { timeout: 1500 }); return () => window.cancelIdleCallback(id); }
    const id = setTimeout(start, 600); return () => clearTimeout(id);
  }, []);
  return load;
}

const phases = [
  { label: "Finished", eyebrow: "01 / The product", title: "", text: "" },
  { label: "Drawing", eyebrow: "02 / The housing", title: "Protection begins with the enclosure.", text: "The cast body gives every fitting its form — and its flame path. Casting and precision machining sit at the heart of how we build." },
  { label: "Exploded", eyebrow: "03 / The assembly", title: "Every part has a purpose.", text: "Body, cover, retaining ring, glass and guard. Each interface is machined, assembled and tested under one roof in Vapi." },
] as const;

const steps = [
  { title: "Understand", text: "Your application, your environment, your specification. Every project starts with the right questions." },
  { title: "Engineer", text: "Choose from the standard range or work with us on a panel built around your requirement." },
  { title: "Manufacture", text: "Casting, machining and assembly — manufacturing experience brought together in Vapi, Gujarat." },
  { title: "Test & deliver", text: "Inspection and testing before dispatch, with a team you can speak to from enquiry to delivery." },
];

const industries = [
  { name: "Oil & gas", slug: "oil-and-gas", text: "Lighting, control and connection equipment for upstream and process areas." },
  { name: "Chemicals", slug: "chemicals", text: "Equipment specified around the gas groups and zones of process plants." },
  { name: "Pharmaceuticals", slug: "pharmaceuticals", text: "Solvent handling, API blocks and clean manufacturing environments." },
  { name: "Refineries", slug: "refineries", text: "Dependable equipment for units, tank farms and loading areas." },
];

const capabilities = ["CIMFR tested", "PESO approved", "Flameproof lighting", "Control stations", "Junction boxes", "Cable glands", "Custom control panels", "In-house casting", "Precision machining", "Assembly & testing"];

type RangeItem = { key: string; name: string; category: string; kind: DiagramKind; href: string; chips: string[] };

const fallbackRange: RangeItem[] = [
  { key: "wg", name: "Well Glass Fitting", category: "Lighting", kind: "wellglass", href: "/catalog", chips: ["IP-66"] },
  { key: "fl", name: "Flood Light Fitting", category: "Lighting", kind: "floodlight", href: "/catalog", chips: ["IP-66"] },
  { key: "pb", name: "Start Stop Push Button", category: "Switchgear", kind: "pushbutton", href: "/catalog", chips: ["IP-66"] },
  { key: "ss", name: "Switch Socket Unit", category: "Switchgear", kind: "switchsocket", href: "/catalog", chips: ["IP-66"] },
  { key: "cg", name: "Cable Gland", category: "Accessories", kind: "gland", href: "/catalog", chips: ["IP-66"] },
  { key: "jb", name: "Junction Box", category: "Junction boxes", kind: "junctionbox", href: "/catalog", chips: ["IP-66"] },
];

function toRange(products: CatalogProductCard[]): RangeItem[] {
  if (!products.length) return fallbackRange;
  return products.slice(0, 6).map((product) => ({
    key: product.slug,
    name: product.name.replace(/^FLP\/WP\s+/i, ""),
    category: product.cat,
    kind: diagramFor(product.name, product.cat),
    href: `/catalog/${product.slug}`,
    chips: [product.ip, product.group, product.type, `${product.variantCount} ${product.variantCount === 1 ? "variant" : "variants"}`].filter(Boolean) as string[],
  }));
}

/* ------------------------------------------------------------------ */
/* Hero: pinned 3D product study                                        */
/* ------------------------------------------------------------------ */

function Hero() {
  const track = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [ready, setReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = p < 0.3 ? 0 : p < 0.64 ? 1 : 2;
    setPhase((current) => (current === next ? current : next));
  });
  const introOpacity = useTransform(scrollYProgress, [0.12, 0.26], [1, 0]);
  const introY = useTransform(scrollYProgress, [0.12, 0.26], [0, -60]);
  const stageScale = useTransform(scrollYProgress, [0, 0.3, 1], [1, 1.06, 1.02]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const onReady = useCallback(() => setReady(true), []);
  const load3D = useDeferred3D();
  // The live model fades in over the identical still; once it is fully opaque the still is
  // removed and only then does the turntable start, so the swap is invisible.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => setSettled(true), 800);
    return () => clearTimeout(id);
  }, [ready]);

  const goToPhase = (index: number) => {
    const element = track.current;
    if (!element) return;
    const distance = element.offsetHeight - window.innerHeight;
    const targets = [0, 0.42, 0.82];
    scrollToTarget(element.offsetTop + distance * targets[index]);
  };

  return <section ref={track} className={styles.heroTrack} aria-labelledby="hero-title">
    <div className={styles.heroSticky}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroGrid} aria-hidden="true" data-active={phase > 0} />

      <motion.div className={styles.stageWrap} style={{ scale: reduce ? 1 : stageScale }}>
        <div className={styles.poster} data-hidden={settled || undefined} aria-hidden="true">
          <Image src={MODEL_POSTER} alt="" width={1200} height={1200} priority fetchPriority="high" sizes="(max-width: 900px) 50vh, 80vh" />
        </div>
        <div className={styles.stage} data-ready={ready}>
          {load3D && <ProductStage exploded={phase === 2} drawing={phase === 1} autoRotate={settled} resetKey={0} onReady={onReady} modelUrl={productExperience.modelUrl} paperColor={INK} lineColor="#f1eee8" showNote={false} />}
        </div>
      </motion.div>

      <motion.div className={styles.heroCopy} style={reduce ? undefined : { opacity: introOpacity, y: introY }}>
        <span className={`${styles.heroEyebrow} ${styles.heroIn}`}><i />Flameproof electrical equipment · Est. 1996</span>
        <h1 className={styles.heroTitle}><span className={styles.heroLine}><span>Built to contain</span></span><span className={styles.heroLine}><em className="serif">the spark.</em></span></h1>
        <p className={styles.heroIn} style={{ animationDelay: "160ms" }}>Lighting, control and connection equipment for hazardous areas — designed, cast, machined and tested in Vapi, India.</p>
        <div className={`${styles.heroActions} ${styles.heroIn}`} style={{ animationDelay: "240ms" }}>
          <Link href="/catalog" className={styles.buttonLight}>Explore the range <ArrowRight size={17} /></Link>
          <Link href="/contact" className={styles.buttonGhost}>Request a quote</Link>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase > 0 && <motion.div key={phase} className={styles.phaseCopy} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6, ease: EASE }}>
          <span>{phases[phase].eyebrow}</span>
          <h2>{phases[phase].title}</h2>
          <p>{phases[phase].text}</p>
          {phase === 2 && <Link href="/engineering" className={styles.textLink}>How we engineer <ArrowUpRight size={16} /></Link>}
        </motion.div>}
      </AnimatePresence>

      <div className={styles.heroFoot}>
        <div className={styles.heroSpecs}><span>CIMFR tested</span><span>PESO approved</span><span>IP-66</span><span>IIA · IIB · IIC</span></div>
        <div className={styles.phaseNav} role="group" aria-label="Product view">
          {phases.map((item, index) => <button key={item.label} type="button" aria-pressed={phase === index} onClick={() => goToPhase(index)}>{phase === index && <motion.span layoutId="phase-pill" className={styles.phasePill} transition={{ type: "spring", stiffness: 380, damping: 34 }} />}<span>{item.label}</span></button>)}
        </div>
        <button type="button" className={styles.scrollCue} onClick={() => goToPhase(Math.min(2, phase + 1))} aria-label="Next view"><ArrowDown size={16} /></button>
        <motion.span className={styles.heroProgress} style={{ width: progressWidth }} aria-hidden="true" />
      </div>
    </div>
  </section>;
}

/* ------------------------------------------------------------------ */
/* Range explorer                                                       */
/* ------------------------------------------------------------------ */

function RangeExplorer({ items }: { items: RangeItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 0.2", "end 0.8"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(items.length - 1, Math.max(0, Math.floor(p * items.length)));
    setActive((current) => (current === next ? current : next));
  });
  const current = items[active];

  return <section className={styles.range} aria-labelledby="range-title">
    <div className={styles.sectionHead}>
      <Reveal><span className={styles.eyebrow}>02 — The range</span></Reveal>
      <RevealLines className={styles.h2} lines={["The range,", <em key="d" className="serif">drawn.</em>]} />
      <Reveal delay={0.1}><p className={styles.lede}>Every ExEC product starts as a drawing. Scroll through the core range — each one designed around the hazardous area it will live in.</p></Reveal>
    </div>

    {/* Desktop: pinned list + drawing */}
    <div ref={track} className={styles.rangeTrack} style={{ height: `${items.length * 62 + 40}vh` }}>
      <div className={styles.rangeSticky}>
        <ol className={styles.rangeList}>
          {items.map((item, index) => <li key={item.key} data-active={index === active}>
            <Link href={item.href}>
              <span className={styles.rangeIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.rangeName}>{item.name}<small>{item.category}</small></span>
              <ArrowUpRight size={20} />
            </Link>
          </li>)}
        </ol>
        <div className={styles.rangeCard}>
          <div className={styles.rangeCardTop}><span>FIG. {String(active + 1).padStart(2, "0")}</span><span>{current.category}</span></div>
          <div className={styles.rangeDrawing}>
            <AnimatePresence mode="wait">
              <motion.div key={current.key} className={styles.rangeDrawingInner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                <ProductDiagram kind={current.kind} play speed={0.7} title={current.name} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className={styles.rangeCardFoot}>
            <div className={styles.chips}>{current.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
            <Link href={current.href} className={styles.circleLink} aria-label={`View ${current.name}`}><ArrowUpRight size={20} /></Link>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile: swipeable drawings */}
    <div className={styles.rangeMobile}>
      {items.map((item, index) => <Link key={item.key} href={item.href} className={styles.rangeMobileCard}>
        <div className={styles.rangeCardTop}><span>FIG. {String(index + 1).padStart(2, "0")}</span><span>{item.category}</span></div>
        <div className={styles.rangeMobileDrawing}><ProductDiagram kind={item.kind} speed={0.8} title={item.name} /></div>
        <strong>{item.name}</strong>
        <div className={styles.chips}>{item.chips.slice(0, 3).map((chip) => <span key={chip}>{chip}</span>)}</div>
      </Link>)}
    </div>

  </section>;
}

/* ------------------------------------------------------------------ */
/* Process                                                              */
/* ------------------------------------------------------------------ */

function StepIcon({ index }: { index: number }) {
  const paths = [
    ["M10 30 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0", "M44 44 L58 58", "M20 30 L40 30 M30 20 L30 40"],
    ["M8 52 L52 8", "M8 52 L20 52 L8 40 Z", "M36 8 L52 8 L52 24", "M14 20 L26 20 M20 14 L20 26"],
    ["M14 22 L46 22 L40 50 L20 50 Z", "M22 14 C22 8 38 8 38 14", "M26 32 L34 32 M24 40 L36 40"],
    ["M30 56 a24 24 0 1 1 0.1 0", "M30 32 L42 20", "M12 36 L18 36 M42 36 L48 36 M30 14 L30 20"],
  ][index];
  return <svg viewBox="0 0 60 60" className={styles.stepIcon} aria-hidden="true">
    {paths.map((d, i) => <motion.path key={i} d={d} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 1.1, delay: 0.2 + i * 0.15, ease: [0.65, 0, 0.35, 1] }} />)}
  </svg>;
}

function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.6"] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return <section className={styles.processWrap} aria-labelledby="process-title">
    <div className={styles.process}>
      <div className={styles.processHead}>
        <Reveal><span className={styles.eyebrowLight}>05 — From brief to build</span></Reveal>
        <RevealLines className={styles.h2} lines={["One team.", <em key="e" className="serif">Every step.</em>]} />
        <Reveal delay={0.1}><p className={styles.ledeLight}>A direct conversation from your first enquiry to the finished equipment — with manufacturing experience brought together in Vapi.</p></Reveal>
      </div>
      <div ref={ref} className={styles.steps}>
        <svg className={styles.stepsLine} viewBox="0 0 1000 2" preserveAspectRatio="none" aria-hidden="true"><motion.line x1="0" y1="1" x2="1000" y2="1" style={{ pathLength: line }} /></svg>
        {steps.map((step, index) => <Reveal key={step.title} delay={index * 0.08} className={styles.step}>
          <span className={styles.stepDot} />
          <span className={styles.stepNumber}>0{index + 1}</span>
          <StepIcon index={index} />
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </Reveal>)}
      </div>
    </div>
  </section>;
}


/* ------------------------------------------------------------------ */
/* Complete collection                                                  */
/* ------------------------------------------------------------------ */

/** Six products from as many different families as possible, in catalog order. */
function pickDistinct(products: CatalogProductCard[], count = 6) {
  const picked: CatalogProductCard[] = [];
  const families = new Set<string>();
  for (const product of products) if (picked.length < count && !families.has(product.filter)) { families.add(product.filter); picked.push(product); }
  for (const product of products) if (picked.length < count && !picked.includes(product)) picked.push(product);
  return picked;
}

function FullCatalog({ products, filters }: { products: CatalogProductCard[]; filters: CatalogFilterOption[] }) {
  const shown = pickDistinct(products);
  const families = filters.filter((filter) => filter.value !== "all" && products.some((product) => product.filter === filter.value)).length;
  return <section id="collection" className={styles.collection} aria-labelledby="collection-title">
    <div className={styles.collectionHead}>
      <div>
        <Reveal><span className={styles.eyebrow}>03 — The complete collection</span></Reveal>
        <RevealLines className={styles.h2} lines={["Every product.", <em key="c" className="serif">One place.</em>]} />
      </div>
      <Reveal delay={0.1} className={styles.collectionCount}><strong><CountUp to={products.length} pad={2} /></strong><span>products across {families} families</span></Reveal>
    </div>
    {shown.length ? <Stagger className={styles.collectionGrid} gap={0.05}>
      {shown.map((product, index) => <CatalogCard key={product.slug} product={product} index={index} />)}
    </Stagger> : <p className={styles.collectionEmpty}>The collection is being updated — contact our team for the latest range.</p>}
    <Reveal className={styles.rangeMore}><Link href="/catalog" className={styles.buttonDark}>{products.length > shown.length ? `View all ${products.length} products` : "Open the full catalog"} <ArrowRight size={17} /></Link></Reveal>
  </section>;
}

/* ------------------------------------------------------------------ */
/* Certificates                                                         */
/* ------------------------------------------------------------------ */

function CertificateArt({ label }: { label: string }) {
  const lines = ["M30 52 H130", "M30 66 H118", "M30 80 H124", "M30 94 H96"];
  const draw = (delay: number) => ({ initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true, amount: 0.6 }, transition: { duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] as const } });
  return <svg viewBox="0 0 200 150" className={styles.certArt} aria-hidden="true">
    <motion.rect x="12" y="10" width="176" height="130" rx="8" {...draw(0)} />
    <motion.rect x="20" y="18" width="160" height="114" rx="4" className={styles.certFine} {...draw(0.15)} />
    <motion.path d="M30 36 H100" className={styles.certStrong} {...draw(0.3)} />
    {lines.map((d, i) => <motion.path key={d} d={d} className={styles.certFine} {...draw(0.4 + i * 0.08)} />)}
    <motion.circle cx="152" cy="98" r="20" className={styles.certSeal} {...draw(0.6)} />
    <motion.circle cx="152" cy="98" r="14" className={styles.certFine} {...draw(0.75)} />
    <motion.path d="M140 116 L136 134 L146 128 L152 136 L156 118" className={styles.certSeal} {...draw(0.85)} />
    <text x="152" y="101" textAnchor="middle" className={styles.certSealText}>{label}</text>
  </svg>;
}

export function Certificates({ eyebrow = "04 — Certificates & approvals" }: { eyebrow?: string }) {
  return <section id="certificates" className={styles.certs} aria-labelledby="certs-title">
    <div className={styles.sectionHead}>
      <Reveal><span className={styles.eyebrow}>{eyebrow}</span></Reveal>
      <RevealLines className={styles.h2} lines={["Tested by CIMFR.", <em key="p" className="serif">Approved by PESO.</em>]} />
      <Reveal delay={0.1}><p className={styles.lede}>Every flameproof design is type-tested and approved before it reaches your plant. Ask for the documents that cover the exact model you are installing.</p></Reveal>
    </div>
    <div className={styles.certGrid}>
      {certificationBodies.map((body, index) => <Reveal key={body.key} delay={index * 0.1} className={styles.certCard}>
        <div className={styles.certTop}>
          <span className={styles.certBadge}><BadgeCheck size={16} /> {body.role}</span>
          <span className={styles.certLocation}>{body.location}</span>
        </div>
        <CertificateArt label={body.short} />
        <h3>{body.short}</h3>
        <p className={styles.certName}>{body.name}</p>
        <p className={styles.certSummary}>{body.summary}</p>
        <ul className={styles.certCovers}>{body.covers.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className={styles.certRecords}>
          {body.certificates.length ? body.certificates.map((record) => <div key={record.number} className={styles.certRecord}>
            <FileText size={16} /><span><strong>{record.number}</strong>{record.scope}{record.validity ? ` · ${record.validity}` : ""}</span>
            {record.documentUrl && <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">View <ArrowUpRight size={14} /></a>}
          </div>) : <div className={styles.certRecord}><FileText size={16} /><span><strong>Model-specific certificates</strong>Copies available on request for the type number you specify.</span></div>}
        </div>
        <a className={styles.certAction} href={`mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(`${body.short} certificate request`)}&body=${encodeURIComponent("Product name / type number:\nConfiguration:\nProject / site:\n")}`}>Request {body.short} documents <ArrowUpRight size={16} /></a>
      </Reveal>)}
      <Reveal delay={0.2} className={styles.certCheck}>
        <span className={styles.eyebrowLight}>Before you install</span>
        <h3>What to check on a certificate</h3>
        <ol>{certificateChecklist.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol>
        <div className={styles.certLinks}>
          <Link href="/certifications">Certificate verification <ArrowUpRight size={15} /></Link>
          <Link href="/knowledge-hub/flameproof-equipment-certification-india">Certification in India, explained <ArrowUpRight size={15} /></Link>
        </div>
      </Reveal>
    </div>
  </section>;
}

/* ------------------------------------------------------------------ */
/* Knowledge centre + journal                                           */
/* ------------------------------------------------------------------ */

export type GuidePreview = { slug: string; shortTitle: string; category: string; description: string; readMinutes: number };

function KnowledgeAndJournal({ guides, posts }: { guides: GuidePreview[]; posts: PublicBlogPost[] }) {
  const [featured, ...rest] = posts;
  return <section id="knowledge" className={styles.knowledge} aria-labelledby="knowledge-title">
    <div className={styles.journalHead}>
      <div>
        <Reveal><span className={styles.eyebrow}>08 — Knowledge centre & journal</span></Reveal>
        <RevealLines className={styles.h2} lines={["Better informed.", <em key="j" className="serif">Better engineered.</em>]} />
      </div>
      <Reveal delay={0.1} className={styles.knowledgeLinks}><Link href="/knowledge-hub" className={styles.textLinkDark}>All guides <ArrowUpRight size={16} /></Link><Link href="/blog" className={styles.textLinkDark}>All articles <ArrowUpRight size={16} /></Link></Reveal>
    </div>

    {guides.length > 0 && <>
      <div className={styles.subHead}><BookOpen size={16} /> Hazardous-area guides</div>
      <Stagger className={styles.guideGrid} itemClassName={styles.guideItem}>
        {guides.slice(0, 8).map((guide, index) => <Link key={guide.slug} href={`/knowledge-hub/${guide.slug}`} className={styles.guide}>
          <div className={styles.guideTop}><span>REF / {String(index + 1).padStart(2, "0")}</span><ArrowUpRight size={18} /></div>
          <h3>{guide.shortTitle}</h3>
          <p>{guide.description}</p>
          <div className={styles.guideMeta}><span>{guide.category}</span><span>{guide.readMinutes} min</span></div>
        </Link>)}
      </Stagger>
    </>}

    <div className={styles.subHead}><FileText size={16} /> From the journal</div>
    {featured ? <div className={styles.journalLayout}>
      <Reveal className={styles.journalFeature}>
        <Link href={`/blog/${featured.slug}`} className={styles.post}>
          <div className={`${styles.postImage} ${styles.postImageLarge}`}><Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 900px) 100vw, 55vw" /></div>
          <div className={styles.postMeta}><span>{featured.cat}</span><span>{featured.date}</span><span>{featured.read} read</span></div>
          <h3 className={styles.postTitleLarge}>{featured.title}</h3>
          <p className={styles.postExcerpt}>{featured.excerpt}</p>
          <span className={styles.postRead}>Read article <ArrowUpRight size={15} /></span>
        </Link>
      </Reveal>
      <div className={styles.journalList}>
        {rest.slice(0, 4).map((post, index) => <Reveal key={post.slug} delay={index * 0.06}>
          <Link href={`/blog/${post.slug}`} className={styles.postRow}>
            <div className={styles.postThumb}><Image src={post.image} alt={post.imageAlt} fill sizes="140px" /></div>
            <div><div className={styles.postMeta}><span>{post.cat}</span><span>{post.read} read</span></div><h3>{post.title}</h3></div>
          </Link>
        </Reveal>)}
      </div>
    </div> : <p className={styles.collectionEmpty}>New articles are on the way.</p>}
  </section>;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export function IndustrialHome({ products, filters, blogPosts, guides }: { products: CatalogProductCard[]; filters: CatalogFilterOption[]; blogPosts: PublicBlogPost[]; guides: GuidePreview[] }) {
  const productOptions = [...products.map((item) => item.name), "Custom Build / Other"];
  const range = toRange(products);

  return <IndustrialShell flush>
    <Hero />

    <div className={styles.marqueeBand}>
      <Marquee items={capabilities.map((item) => <span key={item} className={styles.marqueeItem}>{item}<i aria-hidden="true">✦</i></span>)} />
    </div>

    <section className={styles.statement} aria-labelledby="statement-title">
      <div className={styles.statementGrid}>
        <Reveal><span className={styles.eyebrow}>01 — Our approach</span></Reveal>
        <div>
          <h2 id="statement-title" className={styles.srOnly}>Our approach</h2>
          <ScrollLitText className={styles.statementText} text="Safety isn't something you add at the end. It's engineered in — from the first casting to the final test, for the places where a single spark matters." />
          <Stagger className={styles.facts} itemClassName={styles.fact}>
            <div><strong><CountUp to={1996} from={1960} /></strong><span>Manufacturing flameproof equipment in Vapi, Gujarat</span></div>
            <div><strong><CountUp to={4} pad={2} /></strong><span>In-house stages — casting, machining, assembly and testing</span></div>
            <div><strong>IP-66</strong><span>Ingress protection across the core range</span></div>
            <div><strong>IIC</strong><span>Gas groups IIA, IIB and IIC covered</span></div>
          </Stagger>
        </div>
      </div>
    </section>

    <RangeExplorer items={range} />

    <FullCatalog products={products} filters={filters} />

    <Certificates />

    <Process />

    <section className={styles.panels} aria-labelledby="panels-title">
      <Reveal className={styles.panelsDrawing}>
        <div className={styles.panelsDrawingTop}><span>Engineered to order</span><span>FIG. P-01</span></div>
        <ProductDiagram kind="panel" speed={0.9} />
      </Reveal>
      <div className={styles.panelsCopy}>
        <Reveal><span className={styles.eyebrow}>06 — Custom panels</span></Reveal>
        <RevealLines className={styles.h2} lines={["From one junction box", <span key="a">to <em className="serif">a complete</em></span>, <em key="b" className="serif">control room.</em>]} />
        <Reveal delay={0.1}><p className={styles.lede}>We design and fabricate flameproof control and instrumentation panels to your specification — indicators, meters, controls and entries laid out around how your plant actually runs.</p></Reveal>
        <Stagger className={styles.checks} itemClassName={styles.check}>
          <span>Control & instrumentation panels</span>
          <span>Built around your drawings and zone</span>
          <span>Fabricated and tested under one roof</span>
        </Stagger>
        <Reveal delay={0.2}><Link href="/contact" className={styles.buttonDark}>Discuss a custom panel <ArrowRight size={17} /></Link></Reveal>
      </div>
    </section>

    <section className={styles.industries} aria-labelledby="industries-title">
      <div className={styles.sectionHead}>
        <Reveal><span className={styles.eyebrow}>07 — Industries</span></Reveal>
        <RevealLines className={styles.h2} lines={["Made for", <em key="r" className="serif">the real world.</em>]} />
      </div>
      <div className={styles.industryGrid}>
        <Reveal className={styles.industryPhoto}>
          <Parallax className={styles.industryPhotoInner} distance={50}><Image src={marketingAsset("factory.jpg")} alt="Industrial process plant operating at night" fill sizes="(max-width: 900px) 100vw, 45vw" /></Parallax>
          <span>Specified around the actual zone, gas group and operating conditions.</span>
        </Reveal>
        <ul className={styles.industryList}>
          {industries.map((industry, index) => <Reveal as="li" key={industry.slug} delay={index * 0.06}>
            <Link href={`/industries/${industry.slug}`}>
              <span className={styles.industryIndex}>0{index + 1}</span>
              <span className={styles.industryName}>{industry.name}<small>{industry.text}</small></span>
              <span className={styles.industryArrow}><ArrowUpRight size={20} /></span>
            </Link>
          </Reveal>)}
        </ul>
      </div>
    </section>

    <KnowledgeAndJournal guides={guides} posts={blogPosts} />

    <section className={styles.ctaWrap} aria-labelledby="cta-title">
      <div className={styles.cta}>
        <div className={styles.ctaDrawing} aria-hidden="true"><ProductDiagram kind="junctionbox" labels={false} speed={1.2} /></div>
        <Reveal><span className={styles.eyebrowLight}>09 — Your next project</span></Reveal>
        <RevealLines className={styles.ctaTitle} lines={["Bring the challenge.", <em key="c" className="serif">We&apos;ll bring the engineering.</em>]} />
        <Reveal delay={0.15} className={styles.ctaActions}>
          <RequestQuoteModal productOptions={productOptions} triggerLabel="Request a quote" triggerClassName={styles.buttonAccent} />
          <a href={`mailto:${COMPANY_EMAIL}`} className={styles.buttonGhost}><Mail size={16} /> {COMPANY_EMAIL}</a>
        </Reveal>
        <Reveal delay={0.25} className={styles.ctaLinks}>
          <Link href="/certifications">Certificate verification <ArrowUpRight size={14} /></Link>
          <Link href="/knowledge-hub/flameproof-certification-india">Approval documentation <ArrowUpRight size={14} /></Link>
          <Link href="/catalog">Download the catalog <ArrowUpRight size={14} /></Link>
        </Reveal>
      </div>
    </section>
  </IndustrialShell>;
}
