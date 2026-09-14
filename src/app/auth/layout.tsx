import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { ArrowUpRight, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./auth-layout.module.css";

export const metadata: Metadata = {
  title: "Secure Access",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IndustrialFonts>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#auth-content">
          Skip to access form
        </a>

        <aside className={styles.storyPanel} aria-label="About ExEC secure access">
          <div className={styles.grid} aria-hidden="true" />
          <div className={styles.glow} aria-hidden="true" />

          <header className={styles.brandRow}>
            <Link className={styles.brand} href="/" aria-label="ExEC home">
              <Image
                src="/asset/shortLogo.png"
                alt=""
                width={48}
                height={48}
                priority
              />
              <span>
                <strong>ExEC</strong>
                <small>Explosion Proof Electrical Control</small>
              </span>
            </Link>
            <span className={styles.systemTag}>SYS / 01</span>
          </header>

          <div className={styles.storyContent}>
            <div className={styles.eyebrow}>
              <span className={styles.liveDot} />
              Operator portal online
            </div>
            <p className={styles.statement}>
              The control room
              <span>starts here.</span>
            </p>
            <p className={styles.summary}>
              One secure workspace for sales, inventory, production, and the
              people who keep every operation moving.
            </p>
          </div>

          <div className={styles.containmentGraphic} aria-hidden="true">
            <div className={styles.ringOuter} />
            <div className={styles.ringMiddle} />
            <div className={styles.ringInner} />
            <div className={styles.graphicCore}>
              <ShieldCheck size={30} strokeWidth={1.5} />
              <span>Ex d</span>
            </div>
            <span className={styles.axisLabel}>IEC 60079 // PROTECTED ZONE</span>
          </div>

          <footer className={styles.storyFooter}>
            <div>
              <LockKeyhole size={15} />
              <span>
                <strong>Protected access</strong>
                <small>Encrypted session &amp; identity verification</small>
              </span>
            </div>
            <Link href="/contact">
              Access support <ArrowUpRight size={15} />
            </Link>
          </footer>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.mobileBrandRow}>
            <Link className={styles.mobileBrand} href="/" aria-label="ExEC home">
              <Image
                src="/asset/shortLogo.png"
                alt=""
                width={38}
                height={38}
                priority
              />
              <span>
                <strong>ExEC</strong>
                <small>Secure operator portal</small>
              </span>
            </Link>
            <span className={styles.secureStatus}>
              <Check size={11} strokeWidth={3} /> Secure
            </span>
          </div>

          <main id="auth-content" className={styles.formStage}>
            {children}
          </main>

          <footer className={styles.formFooter}>
            <span>Authorized personnel only</span>
            <span>© {new Date().getFullYear()} ExEC</span>
          </footer>
        </section>
      </div>
    </IndustrialFonts>
  );
}
