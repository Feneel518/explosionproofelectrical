"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { COMPANY_ADDRESS, COMPANY_EMAIL, SITE_NAME } from "@/lib/seo/site";
import styles from "./industrial-home.module.css";

export function IndustrialHeader() {
  const [open, setOpen] = useState(false);
  const links = [["CATALOG", "/catalog"], ["ENGINEERING", "/#engineering"], ["OUR STORY", "/#our-story"], ["LET’S TALK", "/#contact"]];
  return <header className={styles.header}>
    <Link href="/" className={styles.brand} aria-label="ExEC home"><Image src="/marketing/Logo.png" alt="" width={40} height={40} /><strong>ExEC</strong><span>EXPLOSION PROOF<br />ELECTRICAL CONTROL</span></Link>
    <nav className={styles.desktopNav} aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}<ArrowRight size={15} /></Link>)}</nav>
    <button className={styles.menuButton} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    {open && <nav id="mobile-navigation" className={styles.mobileNav} aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={18} /></Link>)}</nav>}
  </header>;
}

export function IndustrialFooter() {
  return <footer className={styles.footer}><div className={styles.footerMain}>
    <Link href="/" className={styles.footerBrand} aria-label="ExEC home">ExEC<span>↗</span></Link>
    <div><p>{SITE_NAME}</p><span>{COMPANY_ADDRESS.streetAddress}<br />Vapi, Gujarat {COMPANY_ADDRESS.postalCode}, India</span><a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a></div>
    <nav aria-label="Footer navigation"><Link href="/catalog">Catalog <ArrowUpRight size={14} /></Link><Link href="/#our-story">Our story <ArrowUpRight size={14} /></Link><Link href="/#contact">Contact <ArrowUpRight size={14} /></Link></nav>
    </div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} ExEC. ALL RIGHTS RESERVED.</span><span>ENGINEERED IN VAPI. BUILT TO PROTECT.</span><a href="#top">BACK TO TOP <ArrowUpRight size={14} /></a></div></footer>;
}

export function IndustrialShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.site} id="top"><a href="#main-content" className={styles.skipLink}>Skip to content</a><div className={styles.pageFrame}><IndustrialHeader /><main id="main-content">{children}</main><IndustrialFooter /></div></div>;
}
