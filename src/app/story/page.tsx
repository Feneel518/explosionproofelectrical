import Image from "next/image";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { marketingAsset } from "@/lib/marketing/data";

const milestones = [
  { year: "1996", tag: "FOUNDED", body: "Flameproof casting workshop opens in GIDC Phase IV, Vapi." },
  { year: "2004", tag: "CERTIFIED", body: "First CIMFR-tested, PESO-approved enclosure range launched." },
  { year: "2011", tag: "EXPANSION", body: "Custom control & instrumentation panel fabrication added in-house." },
  { year: "2018", tag: "LED ERA", body: "Full switch to high-output LED hazardous-area lighting." },
  { year: "2026", tag: "TODAY", body: "100+ certified product types serving plants across India." },
];

const storyValues = [
  { num: "01", title: "CONTAINMENT FIRST", body: "Every flame path is engineered to contain an internal explosion — never just to pass an inspection." },
  { num: "02", title: "TESTED, NOT TRUSTED", body: "Each design clears CIMFR explosion, ingress and thermal tests before it earns a type number." },
  { num: "03", title: "BUILT IN-HOUSE", body: "Casting, machining, wiring and testing happen under one roof in Vapi — full control, full traceability." },
  { num: "04", title: "STAND BEHIND IT", body: "If we wouldn't install it in our own plant, it doesn't leave the floor." },
];

export default function StoryPage() {
  return (
    <MarketingShell active="story">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-white/12">
        <Image src={marketingAsset("factory.jpg")} alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#04121b_28%,rgba(7,37,54,0.72)_72%,rgba(7,37,54,0.32)_100%)]" />
        <div
          className="absolute right-[-160px] top-[-10%] h-[680px] w-[680px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(228,100,20,0.26) 0%, rgba(228,100,20,0) 62%)",
            animation: "glowPulse 6s ease-in-out infinite",
          }}
        />
        <div className="relative px-5 pb-20 pt-16 sm:px-10 lg:max-w-[980px] lg:px-[72px] lg:pb-[88px] lg:pt-24">
          <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs tracking-[0.2em] text-white/55">
            <Link href="/" className="text-[#F17D1E]">HOME</Link>
            &nbsp;/&nbsp;OUR STORY
          </div>
          <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">
            / SINCE 1996 · VAPI, GUJARAT
          </div>
          <h1 className="font-[family-name:var(--font-marketing-display)] text-[72px] uppercase leading-[0.86] tracking-[0.005em] sm:text-[90px] xl:text-[108px]">
            THREE DECADES<br />CONTAINING<br /><span className="text-[#E46414]">THE SPARK.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg font-light leading-8 text-white/74">
            What began as a small flameproof casting workshop in Vapi has grown into one of Gujarat&apos;s trusted names in explosion-proof electrical equipment — built on one stubborn principle: safety you can stand behind.
          </p>
        </div>
      </section>

      {/* ── ORIGIN SPLIT ── */}
      <section className="grid border-b border-white/12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-r border-white/12 p-8 lg:p-[84px_60px]">
          <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">/ HOW WE STARTED</div>
          <h2 className="mb-6 font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-[0.92] sm:text-[62px]">
            A WORKSHOP, A LATHE,<br />AND ONE HARD RULE
          </h2>
          <p className="mb-5 max-w-[520px] text-base font-light leading-[1.78] text-white/72">
            In 1996, the chemical and petrochemical belt around Vapi was booming — and so was the demand for electrical equipment that wouldn&apos;t become the source of the next plant fire. We started with a handful of machinists and a simple commitment: every enclosure that left the floor would be tested to contain an explosion, not just to pass an inspection.
          </p>
          <p className="max-w-[520px] text-base font-light leading-[1.78] text-white/72">
            That rule never changed. The catalogue grew, the certifications stacked up, and LED replaced the old lamps — but the discipline behind every flame path stayed exactly the same.
          </p>
        </div>
        <div className="relative flex min-h-[400px] items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#0c3145_0%,#04121b_78%)] p-14">
          <div className="absolute right-7 top-6 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] text-white/40">FIG. 01 — THE FLOOR</div>
          <Image
            src={marketingAsset("HumanStatic.png")}
            alt="Flameproof unit on the production floor"
            width={480}
            height={480}
            className="max-h-[460px] w-auto max-w-[92%] object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
          />
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="border-b border-white/12 bg-[#061d2b]">
        <div className="px-5 pb-10 pt-16 sm:px-10 lg:px-[60px] lg:pt-20">
          <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">/ THE TIMELINE</div>
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[64px]">MILESTONES ALONG THE WAY</h2>
        </div>
        <div className="grid border-t border-white/12 sm:grid-cols-3 xl:grid-cols-5">
          {milestones.map((m) => (
            <div key={m.year} className="border-b border-r border-white/12 p-8 lg:p-[44px_30px_54px]">
              <div className="mb-6 h-[11px] w-[11px] rounded-full bg-[#E46414] shadow-[0_0_14px_rgba(228,100,20,0.7)]" />
              <div className="font-[family-name:var(--font-marketing-display)] text-[54px] uppercase leading-[0.8]">{m.year}</div>
              <div className="mt-4 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.14em] text-[#F17D1E]">{m.tag}</div>
              <p className="mt-3 text-sm font-light leading-6 text-white/65">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="grid border-b border-white/12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center border-r border-white/12 p-8 lg:p-[80px_50px]">
          <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">/ WHAT WE STAND ON</div>
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-[0.9] sm:text-[60px]">
            THE VALUES<br />UNDER EVERY<br />CASTING
          </h2>
          <Image
            src={marketingAsset("flame.png")}
            alt=""
            width={110}
            height={110}
            className="mt-10 opacity-90 drop-shadow-[0_0_30px_rgba(228,100,20,0.4)]"
          />
        </div>
        <div className="grid sm:grid-cols-2">
          {storyValues.map((v) => (
            <div key={v.num} className="border-b border-r border-white/12 p-8 lg:p-10 xl:p-12">
              <div className="font-[family-name:var(--font-marketing-display)] text-[40px] leading-none text-[#E46414]">{v.num}</div>
              <div className="mt-4 font-[family-name:var(--font-marketing-display)] text-[28px] uppercase tracking-wide">{v.title}</div>
              <p className="mt-3 text-sm font-light leading-6 text-white/62">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="grid border-b border-white/12 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["28+", "YEARS IN", "FLAMEPROOF"],
          ["100+", "CERTIFIED", "PRODUCT TYPES"],
          ["500+", "PLANTS", "SERVED"],
          ["ZERO", "COMPROMISE ON", "SAFETY"],
        ].map(([big, line1, line2]) => (
          <div key={line1} className="border-b border-r border-white/12 p-10 text-center lg:p-[64px_24px]">
            <div className="font-[family-name:var(--font-marketing-display)] text-[70px] uppercase leading-none">
              {big.includes("+") ? big.slice(0, -1) : big}
              {big.includes("+") && <span className="text-[#E46414]">+</span>}
            </div>
            <div className="mt-2 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] text-white/60">
              {line1}<br />{line2}
            </div>
          </div>
        ))}
      </section>

      {/* ── FOUNDER QUOTE ── */}
      <section className="grid items-center border-b border-white/12 bg-[#061d2b] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-r border-white/12 p-8 lg:p-[90px_60px]">
          <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">/ FROM THE FOUNDER</div>
          <p className="font-[family-name:var(--font-marketing-display)] text-4xl uppercase leading-tight sm:text-[40px]">
            &quot;WE&apos;VE NEVER SHIPPED A SINGLE ENCLOSURE WE WOULDN&apos;T BE WILLING TO INSTALL IN OUR OWN PLANT.{" "}
            <span className="text-[#E46414]">THAT&apos;S THE WHOLE BUSINESS.</span>&quot;
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Image src={marketingAsset("Logo.png")} alt="" width={42} height={42} className="h-[42px] w-[42px] object-contain" />
            <div className="font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.14em] leading-6 text-white/60">
              FOUNDER &amp; MANAGING DIRECTOR<br />EXPLOSION PROOF ELECTRICAL CONTROL
            </div>
          </div>
        </div>
        <div className="flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
          <Image
            src={marketingAsset("india.png")}
            alt="Serving plants across India"
            width={300}
            height={300}
            className="max-h-[300px] w-auto max-w-[80%] object-contain opacity-95 drop-shadow-[0_0_40px_rgba(228,100,20,0.25)]"
          />
          <div className="mt-6 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] leading-7 text-white/60">
            FROM VAPI TO HAZARDOUS-AREA<br />PLANTS NATIONWIDE
          </div>
        </div>
      </section>

      {/* ── STORY CTA ── */}
      <section className="border-b border-white/12">
        <div className="flex flex-wrap items-center justify-between gap-8 px-5 py-14 sm:px-10 lg:px-[60px] lg:py-20">
          <div>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-[0.92] sm:text-[56px]">WANT TO WORK WITH US?</h2>
            <p className="mt-4 max-w-[520px] text-base font-light leading-7 text-white/70">
              Tell us about your hazardous-area requirement — our engineers are ready to help you spec it safely.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="bg-[#E46414] px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] shadow-[0_12px_40px_rgba(228,100,20,0.34)]">
              CONTACT US →
            </Link>
            <Link href="/catalog" className="border border-white/35 px-8 py-4 text-sm font-semibold uppercase tracking-[0.1em]">
              BROWSE CATALOG
            </Link>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
