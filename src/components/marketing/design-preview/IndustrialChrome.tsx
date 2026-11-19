"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { COMPANY_ADDRESS, COMPANY_EMAIL, SITE_NAME } from "@/lib/seo/site";
import { AutoReveal, SmoothScroll } from "@/components/site/motion";
import styles from "./chrome.module.css";

const links = [
  ["Products", "/catalog"],
  ["Industries", "/industries"],
  ["Engineering", "/engineering"],
  ["Certificates", "/certifications"],
  ["Knowledge", "/knowledge-hub"],
  ["Journal", "/blog"],
  ["Our story", "/story"],
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function IndustrialHeader() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const open = openPath === pathname;
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 24);
    setHidden(!open && latest > 240 && latest > previous + 2);
    if (latest < previous - 2) setHidden(false);
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenPath(null); };
    window.addEventListener("keydown", closeOnEscape);
    window.__execLenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", closeOnEscape); window.__execLenis?.start(); document.documentElement.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return <>
    <motion.header className={styles.header} data-scrolled={scrolled} initial={reduce ? false : { y: -90, opacity: 0 }} animate={{ y: hidden ? -110 : 0, opacity: 1 }} transition={{ duration: 0.6, ease: EASE }}>
      <Link href="/" className={styles.brand} aria-label="ExEC home">
        <Image src="/marketing/Logo.png" alt="" width={30} height={30} priority />
        <span><strong>ExEC</strong><small>Flameproof since 1996</small></span>
      </Link>
      <nav className={styles.nav} aria-label="Main navigation" onMouseLeave={() => setHovered(null)}>
        {links.map(([label, href]) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} onMouseEnter={() => setHovered(href)} onFocus={() => setHovered(href)}>
          {hovered === href && <motion.span layoutId="nav-hover" className={styles.navHover} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
          <span className={styles.navLabel}>{label}</span>
        </Link>)}
      </nav>
      <div className={styles.actions}>
        <Link href="/contact" className={styles.cta}>Get a quote <ArrowUpRight size={15} /></Link>
        <button className={styles.menuButton} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpenPath(open ? null : pathname)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </motion.header>

    <AnimatePresence>
      {open && <motion.div id="mobile-navigation" className={styles.mobileMenu} initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 0.6, ease: EASE }}>
        <nav aria-label="Mobile navigation">
          {[["Home", "/"], ...links, ["Contact", "/contact"]].map(([label, href], index) => <motion.div key={href} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 + index * 0.05, ease: EASE }}>
            <Link href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpenPath(null)}><span>{String(index + 1).padStart(2, "0")}</span>{label}<ArrowUpRight size={22} /></Link>
          </motion.div>)}
        </nav>
        <motion.div className={styles.mobileFoot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
          <span>{COMPANY_ADDRESS.streetAddress}, Vapi, Gujarat {COMPANY_ADDRESS.postalCode}</span>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </>;
}

const footerColumns = [
  { title: "Products", links: [["Complete catalog", "/catalog"], ["Lighting fittings", "/catalog/category/flameproof-lighting-fittings"], ["Junction boxes", "/catalog/category/flameproof-junction-boxes"], ["Switchgear", "/catalog/category/flameproof-switch-gears"], ["Control panels", "/catalog/category/flameproof-panels"], ["Cable glands", "/catalog/category/flameproof-cable-glands"]] },
  { title: "Company", links: [["Our story", "/story"], ["Engineering", "/engineering"], ["Industries", "/industries"], ["Contact", "/contact"]] },
  { title: "Resources", links: [["Knowledge centre", "/knowledge-hub"], ["Journal", "/blog"], ["Certification documents", "/certifications"], ["Certificate verification", "/certifications"]] },
] as const;

export function IndustrialFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footerTop}>
      <div className={styles.footerIntro}>
        <p className={styles.footerLead}>Equipment for the places where <em className="serif">a single spark matters.</em></p>
        <Link href="/contact" className={styles.footerCta}>Start a conversation <ArrowUpRight size={18} /></Link>
      </div>
      {footerColumns.map((column) => <nav key={column.title} aria-label={column.title} className={styles.footerColumn}>
        <span>{column.title}</span>
        {column.links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </nav>)}
    </div>
    <div className={styles.footerContact}>
      <div><span>Visit</span><p>{SITE_NAME}<br />{COMPANY_ADDRESS.streetAddress}<br />Vapi, Gujarat {COMPANY_ADDRESS.postalCode}, India</p></div>
      <div><span>Write</span><a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a></div>
      <div><span>Since</span><p>1996 · Designed, cast, machined and tested in Vapi</p></div>
    </div>
    <div className={styles.wordmark} aria-hidden="true">ExEC</div>
    <div className={styles.footerBottom}>
      <span>© {new Date().getFullYear()} {SITE_NAME}</span>
      <span>Built to contain the spark.</span>
      <a href="#top" onClick={(event) => { if (window.__execLenis) { event.preventDefault(); window.__execLenis.scrollTo(0); } }}>Back to top ↑</a>
    </div>
  </footer>;
}

export function IndustrialShell({ children, flush = false }: { children: React.ReactNode; flush?: boolean }) {
  return <div className={styles.site} id="top">
    <SmoothScroll />
    {!flush && <AutoReveal />}
    <a href="#main-content" className={styles.skipLink}>Skip to content</a>
    <IndustrialHeader />
    <main id="main-content" className={styles.main} data-flush={flush}>{children}</main>
    <IndustrialFooter />
  </div>;
}
