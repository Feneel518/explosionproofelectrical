"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { animate, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/* Scrolling                                                            */
/* ------------------------------------------------------------------ */

/** Native smooth scroll (instant with reduced motion), leaving room for the floating header. */
export function scrollToTarget(target: number | string | HTMLElement) {
  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  if (typeof target === "number") { window.scrollTo({ top: target, behavior }); return; }
  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 80, behavior });
}

/* ------------------------------------------------------------------ */
/* Reveal                                                               */
/* ------------------------------------------------------------------ */

type RevealProps = { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "article" | "li" | "span" | "p" | "header"; amount?: number };

export function Reveal({ children, delay = 0, y = 28, className, as = "div", amount = 0.2 }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as] as ElementType;
  // Same element either way: the server cannot know the motion preference, and a
  // different tree would leave the server's hidden starting style in place.
  return <Component className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount }} transition={reduce ? { duration: 0 } : { duration: 0.9, delay, ease: EASE }}>{children}</Component>;
}

/** Staggers its direct children into view. Each child is wrapped in a block element. */
export function Stagger({ children, className, itemClassName, gap = 0.08, delay = 0, y = 24 }: { children: ReactNode; className?: string; itemClassName?: string; gap?: number; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);
  const variants = { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: reduce ? { duration: 0 } : { duration: 0.8, ease: EASE } } };
  return <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} variants={{ show: { transition: reduce ? {} : { staggerChildren: gap, delayChildren: delay } } }}>
    {items.map((child, index) => <motion.div key={(isValidElement(child) && child.key) || index} className={itemClassName} variants={variants}>{child}</motion.div>)}
  </motion.div>;
}

/* ------------------------------------------------------------------ */
/* Headline line reveal                                                 */
/* ------------------------------------------------------------------ */

export function RevealLines({ lines, className, delay = 0, as = "h2", play }: { lines: ReactNode[]; className?: string; delay?: number; as?: "h1" | "h2" | "h3" | "p"; play?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const shown = play ?? inView;
  const Tag = as as ElementType;
  return <Tag ref={ref} className={className}>
    {lines.map((line, index) => <span key={index} style={{ display: "block", overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
      <motion.span style={{ display: "block" }} initial={reduce ? false : { y: "105%" }} animate={shown || reduce ? { y: "0%" } : { y: "105%" }} transition={{ duration: 1.05, delay: delay + index * 0.09, ease: EASE }}>{line}</motion.span>
    </span>)}
  </Tag>;
}

/* ------------------------------------------------------------------ */
/* Scroll-lit paragraph (words brighten as you scroll)                  */
/* ------------------------------------------------------------------ */

function LitWord({ word, index, total, progress, still }: { word: string; index: number; total: number; progress: MotionValue<number>; still: boolean }) {
  const start = index / total;
  const opacity = useTransform(progress, [start - 0.08, start + 0.04], [0.16, 1]);
  return <motion.span style={{ opacity: still ? 1 : opacity }}>{word} </motion.span>;
}

export function ScrollLitText({ text, className, accent = [] }: { text: string; className?: string; accent?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  // Same markup with or without reduced motion (the server cannot know the
  // preference), so hydration always matches; reduced motion just keeps words lit.
  const still = Boolean(reduce);
  return <p ref={ref} className={className} aria-label={text}>
    <span aria-hidden="true">{words.map((word, index) => accent.includes(word.replace(/[.,—]/g, ""))
      ? <motion.em key={index} className="serif" style={{ opacity: 1 }}><LitWord word={word} index={index} total={words.length} progress={scrollYProgress} still={still} /></motion.em>
      : <LitWord key={index} word={word} index={index} total={words.length} progress={scrollYProgress} still={still} />)}</span>
  </p>;
}

/* ------------------------------------------------------------------ */
/* Count up                                                             */
/* ------------------------------------------------------------------ */

export function CountUp({ to, from = 0, duration = 1.6, className, pad = 0 }: { to: number; from?: number; duration?: number; className?: string; pad?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!inView) return;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = animate(from, to, { duration: instant ? 0 : duration, ease: EASE, onUpdate: (latest) => setValue(Math.round(latest)) });
    return () => controls.stop();
  }, [inView, from, to, duration]);
  return <span ref={ref} className={className}>{String(value).padStart(pad, "0")}</span>;
}

/* ------------------------------------------------------------------ */
/* Marquee                                                              */
/* ------------------------------------------------------------------ */

export function Marquee({ items, className, speed = 38 }: { items: ReactNode[]; className?: string; speed?: number }) {
  return <div className={className} style={{ overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
    <div className="exec-marquee-track" style={{ display: "flex", width: "max-content", animation: `exec-marquee ${speed}s linear infinite` }}>
      {[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1} style={{ display: "flex", flexShrink: 0 }}>{items.map((item, index) => <span key={index} style={{ display: "inline-flex", alignItems: "center" }}>{item}</span>)}</div>)}
    </div>
    <style>{"@keyframes exec-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media (prefers-reduced-motion: reduce){.exec-marquee-track{animation:none!important}}"}</style>
  </div>;
}

/* ------------------------------------------------------------------ */
/* Parallax helper                                                      */
/* ------------------------------------------------------------------ */

export function Parallax({ children, className, distance = 80 }: { children: ReactNode; className?: string; distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return <div ref={ref} className={className} style={{ overflow: "hidden" }}><motion.div style={{ y: reduce ? 0 : y, height: "100%" }}>{children}</motion.div></div>;
}

/** Tracks which of `count` equal scroll segments of `target` is active. */
export function useScrollSegment(target: React.RefObject<HTMLElement | null>, count: number, offset: ["start start", "end end"] | ["start end", "end start"] = ["start start", "end end"]) {
  const { scrollYProgress } = useScroll({ target, offset });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(latest * count * 0.9999)));
    setActive((current) => (current === next ? current : next));
  });
  return { active, progress: scrollYProgress };
}

/* ------------------------------------------------------------------ */
/* Auto reveal for content pages                                        */
/* ------------------------------------------------------------------ */

/**
 * Fades content blocks in as they scroll into view on server-rendered pages.
 * Only elements that start below the fold are animated, so nothing visible
 * on load ever flashes.
 */
export function AutoReveal({ selector = "main > * > :is(section, div, article, nav), main section > *, main article" }: { selector?: string }) {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fold = window.innerHeight;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((element) => {
      if (element.closest("[data-no-reveal]") || element.querySelector("[data-reveal-skip]")) return false;
      const parentRevealed = element.parentElement?.closest("[data-exec-reveal]");
      if (parentRevealed || element.getBoundingClientRect().top <= fold * 0.92) return false;
      // Data attributes (not className/style) so React hydration is never affected.
      element.setAttribute("data-exec-reveal", "");
      return true;
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        const siblings = Array.from(element.parentElement?.children ?? []).filter((item) => item.hasAttribute("data-exec-reveal"));
        element.setAttribute("data-exec-delay", String(Math.min(siblings.indexOf(element), 4)));
        element.setAttribute("data-exec-reveal", "in");
        observer.unobserve(element);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    elements.forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); elements.forEach((element) => { element.removeAttribute("data-exec-reveal"); element.removeAttribute("data-exec-delay"); }); };
  }, [selector, pathname]);
  return null;
}
