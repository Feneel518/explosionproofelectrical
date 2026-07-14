import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "About ExEC",
  description:
    "Learn about Explosion Proof Electrical Control (ExEC), a Vapi-based flameproof and explosion-proof electrical manufacturer serving hazardous-area industries.",
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description:
      "ExEC is a trusted flameproof and explosion-proof electrical manufacturer in Gujarat, India.",
    url: `${SITE_URL}/about-us`,
  },
};

export default function AboutUsPage() {
  return (
    <main className="space-y-8 pb-10">
      <section className="border-y border-white py-8 md:py-12">
        <h1 className="text-3xl font-semibold tracking-wide md:text-5xl">About Us</h1>
        <p className="mt-3 max-w-4xl text-sm text-white/85 md:text-base">
          Explosion Proof Electrical Control (ExEC) is a flameproof and explosion-proof
          electrical manufacturer based in Vapi, Gujarat, focused on safety, quality,
          and long-term industrial reliability.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-white p-5">
          <h2 className="text-xl font-semibold">Our Specialization</h2>
          <p className="mt-2 text-sm text-white/85">
            We manufacture flameproof junction boxes, flameproof panels, well glass
            fittings, bulkhead lights, and other hazardous-area electrical solutions
            for demanding industrial applications.
          </p>
        </article>
        <article className="rounded-xl border border-white p-5">
          <h2 className="text-xl font-semibold">Quality & Certification Focus</h2>
          <p className="mt-2 text-sm text-white/85">
            Our manufacturing flow is built around robust engineering standards with
            a strong focus on reliability, traceability, and compliance for hazardous
            environments.
          </p>
        </article>
        <article className="rounded-xl border border-white p-5">
          <h2 className="text-xl font-semibold">Industries We Serve</h2>
          <p className="mt-2 text-sm text-white/85">
            We support chemical, pharmaceutical, process, and industrial plants where
            explosion-proof safety standards are critical for operations.
          </p>
        </article>
        <article className="rounded-xl border border-white p-5">
          <h2 className="text-xl font-semibold">Service Regions</h2>
          <p className="mt-2 text-sm text-white/85">
            ExEC serves customers across Vapi, Silvassa, Daman, Valsad, Gujarat, and
            across India with responsive support and delivery.
          </p>
        </article>
      </section>
    </main>
  );
}
