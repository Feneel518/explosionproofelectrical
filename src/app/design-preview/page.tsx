import type { Metadata } from "next";
export { default } from "@/app/page";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Engineering in Every Detail - Design Preview",
  description: "Explore ExEC flameproof equipment through an interactive 3D product study. Engineered in Vapi since 1996.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};
