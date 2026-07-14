import Image from "next/image";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactForm } from "@/components/marketing/ContactForm";
import { marketingAsset } from "@/lib/marketing/data";
import { getQuoteProductOptions } from "@/lib/marketing/quoteProductOptions";

const contactInfo = [
  { label: "FACTORY & OFFICE", value: "GIDC Phase IV, Vapi", sub: "Gujarat 396195, India" },
  { label: "EMAIL", value: "info@explosionproofelectrical.com", sub: "Sales & engineering enquiries" },
  { label: "PHONE", value: "+91 260 000 0000", sub: "Mon–Sat · 9:30 AM – 6:30 PM IST" },
  { label: "CERTIFICATION", value: "CIMFR Tested · PESO Approved", sub: "IP-66 · Ex d IIA·IIB·IIC" },
];

const departments = [
  { name: "SALES & QUOTES", desc: "Pricing, lead times and stock availability across the catalogue.", email: "sales@explosionproofelectrical.com" },
  { name: "ENGINEERING", desc: "Zone, gas-group and load sizing — plus custom panel design.", email: "engineering@explosionproofelectrical.com" },
  { name: "SUPPORT", desc: "Datasheets, certificates and after-sales maintenance guidance.", email: "support@explosionproofelectrical.com" },
];

export default async function ContactPage() {
  const productOptions = await getQuoteProductOptions();

  return (
    <MarketingShell active="contact">

      {/* ── HERO ── */}
      <section className="border-b border-white/12 bg-[#061d2b]">
        <div className="px-5 pb-14 pt-14 sm:px-10 lg:px-[60px]">
          <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs tracking-[0.2em] text-white/55">
            <Link href="/" className="text-[#F17D1E]">HOME</Link>
            &nbsp;/&nbsp;CONTACT
          </div>
          <div className="mb-4 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">
            / LET&apos;S TALK SAFETY
          </div>
          <h1 className="font-[family-name:var(--font-marketing-display)] text-[72px] uppercase leading-[0.88] tracking-[0.01em] sm:text-[88px]">
            GET IN TOUCH
          </h1>
          <p className="mt-5 max-w-[640px] text-lg font-light leading-7 text-white/70">
            Send us your zone, gas group and load — or just your question. Our engineers will recommend the certified product or build the flameproof panel you need.
          </p>
        </div>
      </section>

      {/* ── FORM + INFO ── */}
      <section className="grid border-b border-white/12 lg:grid-cols-[1.1fr_0.9fr]">

        {/* form */}
        <div className="border-r border-white/12 p-8 lg:p-[72px_60px]">
          <div className="mb-7 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">/ SEND A REQUIREMENT</div>
          <ContactForm productOptions={productOptions} />
        </div>

        {/* info */}
        <div className="flex flex-col bg-[#061d2b]">
          {contactInfo.map((c) => (
            <div key={c.label} className="border-b border-white/12 px-10 py-8 lg:px-11">
              <div className="mb-3 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] text-[#F17D1E]">{c.label}</div>
              <div className="text-base leading-6">{c.value}</div>
              <div className="mt-1.5 text-sm font-light text-white/55">{c.sub}</div>
            </div>
          ))}
          <div className="relative flex min-h-[240px] flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#0c3145_0%,#04121b_80%)]">
            <div className="absolute left-6 top-5 font-[family-name:var(--font-marketing-mono)] text-[10.5px] uppercase tracking-[0.14em] text-white/45">
              LOCATION — GUJARAT, INDIA
            </div>
            <Image
              src={marketingAsset("gujarat.png")}
              alt="ExEC location in Vapi, Gujarat"
              width={300}
              height={300}
              className="max-h-[300px] max-w-[78%] object-contain opacity-85 drop-shadow-[0_0_20px_rgba(228,100,20,0.2)] invert"
            />
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section className="border-b border-white/12">
        <div className="px-5 pb-8 pt-14 sm:px-10 lg:px-[60px]">
          <div className="mb-4 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">/ REACH THE RIGHT TEAM</div>
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[54px]">DIRECT LINES</h2>
        </div>
        <div className="grid border-t border-white/12 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.name} className="border-b border-r border-white/12 p-8 lg:p-[44px_40px_50px]">
              <div className="font-[family-name:var(--font-marketing-display)] text-[30px] uppercase tracking-[0.02em]">{d.name}</div>
              <p className="mt-3 text-sm font-light leading-6 text-white/62">{d.desc}</p>
              <div className="mt-5 font-[family-name:var(--font-marketing-mono)] text-[12px] tracking-[0.08em] text-[#F17D1E]">
                <a href={`mailto:${d.email}`}>{d.email}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

    </MarketingShell>
  );
}
