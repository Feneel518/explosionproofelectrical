import { Barlow_Condensed, Inter, Space_Mono } from "next/font/google";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-industrial-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-industrial-sans", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-industrial-mono", display: "swap" });

export function IndustrialFonts({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${sans.variable} ${mono.variable}`}>{children}</div>;
}
