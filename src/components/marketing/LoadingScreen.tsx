"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Bebas_Neue, Inter, Space_Mono } from "next/font/google";
import { marketingAsset } from "@/lib/marketing/data";
import styles from "./LoadingScreen.module.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marketing-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-marketing-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-marketing-mono",
});

export function LoadingScreen() {
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState("INITIALIZING");
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const statuses = ["INITIALIZING", "LOADING CATALOG", "VERIFYING CERTS", "READY"];
    const dur = 2400;
    const start = Date.now();

    const interval = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dur);
      setPct(Math.round(t * 100));
      setStatus(statuses[Math.min(statuses.length - 1, Math.floor(t * statuses.length))]);

      if (t >= 1) {
        clearInterval(interval);
        setTimeout(() => setFading(true), 380);
        setTimeout(() => setGone(true), 1180);
      }
    }, 60);

    return () => clearInterval(interval);
  }, []);

  if (gone) return null;

  return (
    <div
      className={`${bebas.variable} ${inter.variable} ${spaceMono.variable} fixed inset-0 z-[9999] flex items-center justify-center bg-[#04121b] font-[family-name:var(--font-marketing-sans)]`}
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.7s ease", pointerEvents: fading ? "none" : "auto" }}
    >
      {/* ambient glow */}
      <div
        className={`${styles.glow} absolute left-1/2 top-[42%] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full`}
        style={{
          width: 680,
          height: 680,
          background: "radial-gradient(circle, rgba(228,100,20,0.22) 0%, rgba(228,100,20,0) 62%)",
        }}
      />

      {/* edge rails */}
      <div className="pointer-events-none absolute inset-0 border-x border-white/10" />

      {/* corner labels */}
      <div className="absolute left-10 top-8 hidden font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.18em] text-white/45 sm:block">
        EXEC · EXPLOSION PROOF ELECTRICAL CONTROL
      </div>
      <div className="absolute right-10 top-8 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.18em] text-[#F17D1E]">
        EST. 1996
      </div>
      <div className="absolute bottom-8 left-10 hidden font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.18em] text-white/45 sm:block">
        VAPI · GUJARAT · INDIA
      </div>
      <div className="absolute bottom-8 right-10 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.18em] text-white/45">
        {status}
      </div>

      {/* center stack */}
      <div className="relative flex flex-col items-center text-center">
        {/* spinning ring around logo */}
        <div className="relative mb-[38px] flex h-[148px] w-[148px] items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/12" />
          <div
            className={`${styles.ring} absolute inset-0 rounded-full`}
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 42deg, rgba(228,100,20,0.35) 74deg, #E46414 112deg, rgba(241,125,30,0.35) 150deg, transparent 190deg, transparent 360deg)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            }}
          />
          <div
            className={`${styles.ringReverse} absolute inset-[12px] rounded-full`}
            style={{
              background:
                "conic-gradient(from 180deg, transparent 0deg, transparent 210deg, rgba(255,255,255,0.22) 250deg, transparent 290deg, transparent 360deg)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))",
            }}
          />
          <Image
            src={marketingAsset("Logo.png")}
            alt="ExEC"
            width={78}
            height={78}
            className={`${styles.logo} object-contain`}
          />
        </div>

        <div
          className={`${styles.title} font-[family-name:var(--font-marketing-display)] text-[48px] uppercase leading-[0.84] tracking-[0.05em] sm:text-[64px]`}
        >
          BUILT TO CONTAIN<br />
          <span className="text-[#E46414]">THE SPARK</span>
        </div>

        <div
          className={`${styles.subtitle} mt-5 font-[family-name:var(--font-marketing-mono)] text-[12px] uppercase tracking-[0.26em] text-white/55`}
        >
          FLAMEPROOF &amp; EXPLOSION-PROOF EQUIPMENT
        </div>

        {/* progress bar */}
        <div className="mt-[46px] w-[340px] max-w-[70vw]">
          <div className="mb-3 flex items-center justify-between font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] text-white/50">
            <span>LOADING</span>
            <span className="text-[#F17D1E]">{pct}%</span>
          </div>
          <div className="relative h-[3px] overflow-hidden bg-white/12">
            <div
              className="absolute inset-y-0 left-0 bg-[#E46414]"
              style={{
                width: `${pct}%`,
                boxShadow: "0 0 14px rgba(228,100,20,0.7)",
                transition: "width 0.1s ease",
              }}
            />
            <div
              className={`${styles.sweep} absolute inset-y-0 w-[60px]`}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
