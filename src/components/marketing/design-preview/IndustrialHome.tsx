"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { marketingAsset } from "@/lib/marketing/data";
import { productExperience } from "@/lib/marketing/productExperience";
import { COMPANY_EMAIL } from "@/lib/seo/site";
import { RequestQuoteModal } from "@/components/marketing/RequestQuoteModal";
import styles from "./industrial-home.module.css";
import collection from "./catalog.module.css";
import { IndustrialHeader, IndustrialFooter } from "./IndustrialChrome";
import { CatalogCard } from "./CatalogCard";
import { ShareActions } from "./ShareActions";
import { BlogHomeSection } from "./BlogHomeSection";
import type { CatalogProductCard } from "@/lib/marketing/catalog";
import type { PublicBlogPost } from "@/lib/marketing/blog";

const ProductStage = dynamic(() => import("./ProductStage"), {
  ssr: false,
  loading: () => <div className={styles.stageLoading}><Image src={marketingAsset("wellglass.png")} alt="ExEC wellglass light" width={300} height={360} priority /><span>PREPARING THE PRODUCT STUDY</span></div>,
});
const details = [
  { label: "Cast enclosure", code: "01", title: "Protection begins with the housing.", text: "The enclosure gives the fitting its distinctive form. Casting and precision machining are at the heart of the ExEC manufacturing process." },
  { label: "Glass chamber", code: "02", title: "A clearer view of the details.", text: "Inside the wellglass form, the light source sits within a glass chamber. Explore the assembly to see how its elements come together." },
  { label: "Protective guard", code: "03", title: "Every part has a purpose.", text: "The metal guard surrounds the glass. From the housing to the last visible fastener, the complete assembly deserves a closer look." },
];
const steps = [
  { title: "Understand", text: "Your application. Your environment. Your specification. Every project starts with the right questions." },
  { title: "Engineer", text: "Choose from our product range or work with us on a control panel built around your requirements." },
  { title: "Manufacture", text: "Casting, machining and assembly. Manufacturing experience brought together in Vapi, Gujarat." },
  { title: "Test & deliver", text: "Inspection and testing before dispatch, with a team you can speak to from enquiry to delivery." },
];

export function IndustrialHome({ products, blogPosts }: { products: CatalogProductCard[]; blogPosts: PublicBlogPost[] }) {
  const productOptions = [...products.map((item) => item.name), "Custom Build / Other"];
  const [exploded, setExploded] = useState(false);
  const [drawing, setDrawing] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const siteRef = useRef<HTMLDivElement>(null);
  const hasInteracted = useRef(false);
  const onSceneReady = useCallback(() => {
    setSceneReady(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setDrawing(false);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!preference.matches) siteRef.current?.setAttribute("data-motion", "true");
    const onPreferenceChange = () => {
      if (preference.matches) { setDrawing(false); setAutoRotate(false); }
    };
    preference.addEventListener("change", onPreferenceChange);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    siteRef.current?.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); preference.removeEventListener("change", onPreferenceChange); };
  }, []);

  useEffect(() => {
    if (!sceneReady || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (!hasInteracted.current) setDrawing(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [sceneReady]);

  const chooseView = (mode: "finished" | "drawing" | "exploded") => {
    hasInteracted.current = true;
    setDrawing(mode === "drawing");
    setExploded(mode === "exploded");
  };

  return <div className={styles.site} id="top" ref={siteRef}>
    <a href="#main-content" className={styles.skipLink}>Skip to content</a>
    <div className={styles.pageFrame}>
      <IndustrialHeader />

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroDrawing}>
            <div className={styles.rulerTop} aria-hidden="true" /><div className={styles.rulerLeft} aria-hidden="true" />
            <span className={styles.cornerTL} aria-hidden="true">+</span><span className={styles.cornerTR} aria-hidden="true">+</span><span className={styles.cornerBL} aria-hidden="true">+</span><span className={styles.cornerBR} aria-hidden="true">+</span>
            <div className={styles.drawingHeader}><div><span className={styles.smallLabel}>THE ExEC PRODUCT STUDY — 001</span><p>FLAMEPROOF<br />45W LED WELLGLASS</p></div><div><span className={styles.smallLabel}>ENGINEERED IN VAPI, INDIA</span><p className={styles.since}>SINCE 1996 <span>↗</span></p></div></div>
            <div className={styles.sceneBackdrop} aria-hidden="true"><span className={styles.axisVertical} /><span className={styles.axisHorizontal} /><span className={styles.technicalCircle} /><span className={styles.dimensionLine}>PRODUCT STUDY / NOT TO SCALE</span></div>
            <div className={styles.productStage}><ProductStage exploded={exploded} autoRotate={autoRotate} drawing={drawing} resetKey={resetKey} onReady={onSceneReady} modelUrl={productExperience.modelUrl} /></div>
            <div className={styles.annotationLeft}><button type="button" aria-expanded={selectedDetail === 0} onClick={() => setSelectedDetail(selectedDetail === 0 ? null : 0)}><span className={styles.annotationDot}><Plus size={12} /></span><span><small>[01] / CONSTRUCTION</small>CAST ENCLOSURE</span></button><span className={styles.annotationLine} aria-hidden="true" /></div>
            <div className={styles.annotationRight}><span className={styles.annotationLine} aria-hidden="true" /><button type="button" aria-expanded={selectedDetail === 2} onClick={() => setSelectedDetail(selectedDetail === 2 ? null : 2)}><span className={styles.annotationDot}><Plus size={12} /></span><span><small>[03] / ASSEMBLY</small>PROTECTIVE GUARD</span></button></div>
            {selectedDetail !== null && <div className={styles.annotationInfo} role="status"><button type="button" aria-label="Close component detail" onClick={() => setSelectedDetail(null)}><X size={15} /></button><span>[{details[selectedDetail].code}] / {details[selectedDetail].label}</span><h3>{details[selectedDetail].title}</h3><p>{details[selectedDetail].text}</p></div>}
            <div className={styles.drawingFooter}><span>DRAG TO ROTATE<br /><small>OR USE THE ARROW KEYS</small></span><div className={styles.sceneControls}><div role="group" aria-label="Product view" className={styles.viewModes}><button type="button" aria-pressed={!drawing && !exploded} onClick={() => chooseView("finished")}>FINISHED</button><button type="button" aria-pressed={drawing} onClick={() => chooseView("drawing")}>DRAWING</button><button type="button" aria-pressed={exploded} onClick={() => chooseView("exploded")}>EXPLODED</button></div><button type="button" className={styles.iconButton} aria-label={autoRotate ? "Pause rotation" : "Start rotation"} aria-pressed={autoRotate} onClick={() => setAutoRotate(!autoRotate)}>{autoRotate ? <Pause size={14} /> : <Play size={14} />}</button><button type="button" className={styles.iconButton} aria-label="Reset product view" onClick={() => { setResetKey((key) => key + 1); chooseView("finished"); setSelectedDetail(null); }}><RotateCcw size={16} /></button></div></div>
          </div>
          <div className={styles.heroCaption}><h1 id="hero-title">ENGINEERED TO CONTAIN.<br />BUILT TO PROTECT.</h1><p>Flameproof electrical equipment for the places where a single spark matters. Designed, manufactured and tested with purpose.</p><a href="#engineering"><span>DISCOVER THE DETAILS</span><ArrowDown size={21} /></a></div>
        </section>

        <div className={styles.certificationStrip}><span><i />CIMFR TESTED</span><span><i />PESO APPROVED</span><span><i />MANUFACTURED IN VAPI</span><span><i />ENGINEERING SAFETY SINCE 1996</span></div>

        <section id="engineering" className={styles.engineeringSection}>
          <div className={styles.sectionLabel}><span>01 / THE ENGINEERING</span><span>PRECISION IN EVERY PART.</span></div>
          <div className={styles.statement} data-reveal><span className={styles.statementMarker}>[Ex]</span><h2>SAFETY ISN’T SOMETHING<br />YOU ADD AT THE END.<br /><span>IT’S ENGINEERED IN.<br />FROM THE VERY START.</span></h2><div className={styles.statementAside}><p>From a single enclosure to a complete control panel, the smallest details deserve our full attention.</p><Link href="/engineering" className={styles.lineLink}>EXPLORE OUR ENGINEERING <ArrowUpRight size={17} /></Link></div></div>
          <div className={styles.engineeringDetails}>{details.map((item, index) => <article key={item.code} data-reveal><div><span>[{item.code}]</span><Plus size={16} aria-hidden="true" /></div><h3>{item.label}</h3><p>{item.text}</p><a href="#top" onClick={() => { setSelectedDetail(index); chooseView("exploded"); }}>INSPECT THE ASSEMBLY <ArrowUpRight size={16} /></a></article>)}</div>
        </section>

        <section id="products" className={styles.productsSection}>
          <div className={styles.sectionLabel}><span>02 / THE PRODUCT RANGE</span><span>YOUR ENVIRONMENT. OUR EXPERTISE.</span></div>
          <div className={styles.sectionHeading} data-reveal><h2>DIFFERENT CHALLENGES.<br /><span>THE SAME COMMITMENT.</span></h2><Link href="/catalog" className={styles.lineLink}>VIEW COMPLETE CATALOG <ArrowUpRight size={19} /></Link></div>
          <div className={collection.homeCollection}>{products.slice(0, 6).map((product, index) => <CatalogCard key={product.slug} product={product} index={index} />)}</div>
          {!products.length && <div className={collection.empty}><h3>Our product collection is being updated.</h3><p>Speak with our team about your requirement.</p><a href="#contact">CONTACT OUR TEAM <ArrowUpRight size={17} /></a></div>}
          <div className={styles.customBar}><span>THE COMPLETE COLLECTION. READY TO SHARE.</span><ShareActions title="ExEC product catalog" path="/catalog" label="Share catalog" /></div>
        </section>

        <section className={styles.processSection}><div className={styles.sectionLabel}><span>03 / FROM BRIEF TO BUILD</span><span>ONE TEAM. EVERY STEP.</span></div><div className={styles.processBody}><div className={styles.processIntro} data-reveal><h2>GOOD ENGINEERING.<br /><span>AT EVERY STAGE.</span></h2><p>Manufacturing experience from Vapi, Gujarat. A direct conversation from your first enquiry to the finished equipment.</p><div className={styles.processNumeral} aria-hidden="true">0{activeStep + 1}<span>/ 04</span></div></div><div className={styles.processSteps}>{steps.map((step, index) => <div key={step.title} className={activeStep === index ? styles.activeStep : ""}><button type="button" aria-expanded={activeStep === index} aria-controls={`step-content-${index}`} onClick={() => setActiveStep(index)}><span>0{index + 1}</span><strong>{step.title}</strong><Plus size={20} /></button><div id={`step-content-${index}`} hidden={activeStep !== index}><p>{step.text}</p></div></div>)}</div></div></section>

        <section id="our-story" className={styles.storySection}>
          <div className={styles.sectionLabel}><span>04 / OUR STORY</span><span>VAPI, GUJARAT / EST. 1996</span></div>
          <div className={styles.storyGrid} data-reveal><div><span className={styles.storyYear}>1996<span>THE START OF OUR STORY</span></span><h2>ROOTED IN VAPI.<br /><span>BUILT FOR INDIA.</span></h2></div><div><p>Since 1996, Explosion Proof Electrical Control has designed and manufactured flameproof electrical equipment in Vapi, Gujarat. Casting, machining, assembly and testing come together with one purpose: protecting people, assets and facilities.</p><p>From a single junction box to a complete control room, we design and fabricate flameproof control and instrumentation panels around your specification.</p><blockquote>&quot;To keep India&apos;s most demanding plants, their people, assets and facilities safe from the smallest spark.&quot;<cite>OUR MISSION</cite></blockquote><Link href="/story" className={styles.lineLink}>READ OUR FULL STORY <ArrowUpRight size={17} /></Link></div></div>
        </section>

        <BlogHomeSection posts={blogPosts} />

        <section id="real-world" className={styles.industrySection} aria-labelledby="real-world-title"><div className={styles.factoryPhoto}><Image src={marketingAsset("factory.jpg")} alt="Industrial process plant operating at night" fill sizes="(max-width: 760px) 100vw, 55vw" /><span>06 / HAZARDOUS ENVIRONMENTS</span></div><div className={styles.industryCopy} data-reveal><span className={styles.smallLabel}>MADE FOR THE REAL WORLD</span><h2 id="real-world-title">WHERE THE DETAILS<br />MAKE ALL THE<br /><span>DIFFERENCE.</span></h2><p>Lighting, controls and instrumentation for demanding applications—specified around the actual zone, gas group and operating conditions.</p><div>{[["Oil & gas", "oil-and-gas"], ["Chemicals", "chemicals"], ["Pharmaceuticals", "pharmaceuticals"], ["Process industries", "process-industries"]].map(([industry, anchor], index) => <Link href={`/engineering#${anchor}`} key={industry}><span>[0{index + 1}]</span>{industry}<ArrowUpRight size={16} /></Link>)}</div></div></section>

        <section id="contact" className={styles.contactSection}><div className={styles.sectionLabel}><span>07 / YOUR NEXT PROJECT</span><span>LET’S MAKE IT HAPPEN.</span></div><div className={styles.contactBody} data-reveal><h2>BRING THE CHALLENGE.<br /><span>WE’LL BRING<br />THE ENGINEERING.</span></h2><div><p>Share your requirements with our team.<br />Let’s take the next step, together.</p><div className={styles.quoteButton}><RequestQuoteModal productOptions={productOptions} contentClassName={styles.quoteDialog} /></div><Link href="/contact" className={styles.emailLink}>CONTACT OUR TEAM <ArrowUpRight size={17} /></Link><a href={`mailto:${COMPANY_EMAIL}`} className={styles.emailLink}>EMAIL US DIRECTLY <ArrowUpRight size={17} /></a></div></div></section>
      </main>

      <IndustrialFooter />
    </div>
  </div>;
}
