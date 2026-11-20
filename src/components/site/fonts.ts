import localFont from "next/font/local";

/**
 * Public-site type system (self-hosted, OFL-licensed — see ./fonts/README.md).
 * - Inter Tight: interface and headlines
 * - Instrument Serif: italic accents inside headlines
 * - JetBrains Mono: technical labels, specs and drawing annotations
 */
export const siteSans = localFont({
  src: "./fonts/InterTight-Variable.woff2",
  weight: "100 900",
  variable: "--font-site-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export const siteSerif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-site-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const siteMono = localFont({
  src: "./fonts/JetBrainsMono-Variable.woff2",
  weight: "100 800",
  variable: "--font-site-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const siteFontVariables = `${siteSans.variable} ${siteSerif.variable} ${siteMono.variable}`;
