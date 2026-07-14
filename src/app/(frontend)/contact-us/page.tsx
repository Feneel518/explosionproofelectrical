import type { Metadata } from "next";
import Link from "next/link";

import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_GSTIN,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Contact ExEC",
  description:
    "Contact Explosion Proof Electrical Control for flameproof and explosion-proof electrical product enquiries, quotations, and technical support.",
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    title: `Contact ${SITE_NAME}`,
    description:
      "Get in touch with ExEC for flameproof product enquiries and industrial electrical requirements.",
    url: `${SITE_URL}/contact-us`,
  },
};

export default function ContactUsPage() {
  return (
    <main className="space-y-8 pb-10">
      <section className="border-y border-white py-8 md:py-12">
        <h1 className="text-3xl font-semibold tracking-wide md:text-5xl">Contact Us</h1>
        <p className="mt-3 max-w-4xl text-sm text-white/85 md:text-base">
          For flameproof and explosion-proof electrical product enquiries, share your
          requirement and our team will support you with product guidance and quotations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-white p-5">
          <h2 className="text-xl font-semibold">Registered Address</h2>
          <p className="mt-2 text-sm text-white/85">
            {COMPANY_ADDRESS.streetAddress}, {COMPANY_ADDRESS.addressLocality},{" "}
            {COMPANY_ADDRESS.addressRegion}, India
          </p>
          <p className="mt-1 text-sm text-white/85">PIN: {COMPANY_ADDRESS.postalCode}</p>
          <p className="mt-1 text-sm text-white/85">GSTIN: {COMPANY_GSTIN}</p>
        </article>

        <article className="rounded-xl border border-white p-5">
          <h2 className="text-xl font-semibold">Sales Enquiries</h2>
          <p className="mt-2 text-sm text-white/85">
            Email:{" "}
            <a className="underline underline-offset-4" href={`mailto:${COMPANY_EMAIL}`}>
              {COMPANY_EMAIL}
            </a>
          </p>
          <p className="mt-2 text-sm text-white/85">
            You can also use the enquiry form from our homepage featured products section.
          </p>
          <Link
            href="/#newsletter"
            className="mt-4 inline-flex rounded-md border border-white px-4 py-2 text-sm font-medium"
          >
            Go To Enquiry Section
          </Link>
        </article>
      </section>
    </main>
  );
}
