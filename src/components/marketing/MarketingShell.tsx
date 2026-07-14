import { Bebas_Neue, Inter, Space_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { marketingAsset } from "@/lib/marketing/data";
import { getQuoteProductOptions } from "@/lib/marketing/quoteProductOptions";
import { canCurrentUserAccessDashboard } from "@/lib/check/dashboardAccess";
import { RequestQuoteModal } from "@/components/marketing/RequestQuoteModal";

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

type MarketingShellProps = {
  children: ReactNode;
  active?: "home" | "catalog" | "blog" | "story" | "contact";
};

export async function MarketingShell({
  children,
  active = "home",
}: MarketingShellProps) {
  const [showDashboardLink, productOptions] = await Promise.all([
    canCurrentUserAccessDashboard(),
    getQuoteProductOptions(),
  ]);

  return (
    <main
      className={`${bebas.variable} ${inter.variable} ${spaceMono.variable} min-h-screen bg-[#04121b] px-3 text-white antialiased sm:px-5 xl:px-8`}>
      <div className="mx-auto w-full max-w-[1500px] border-x border-white/12 bg-[#04121b] font-[family-name:var(--font-marketing-sans)]">
        <UtilityBar showDashboardLink={showDashboardLink} />
        <MarketingNav active={active} productOptions={productOptions} />
        {children}
        <MarketingFooter />
      </div>
    </main>
  );
}

function UtilityBar({ showDashboardLink }: { showDashboardLink: boolean }) {
  return (
    <div className="border-b border-white/12 bg-[#061d2b]">
      <div className="flex min-h-10 flex-col gap-2 px-4 py-3 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.14em] text-white/65 sm:px-8 lg:h-[42px] lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-[#F17D1E]">●</span>
          <span>GIDC Phase IV / Vapi / Gujarat / India</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-white/50">Est. 1996</span>
          <a href="mailto:info@explosionproofelectrical.com">info@explosionproofelectrical.com</a>
          {showDashboardLink && (
            <Link
              href="/dashboard"
              className="border-b border-[#E46414] pb-0.5 text-white">
              Dashboard ↗
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketingNav({
  active,
  productOptions,
}: {
  active: "home" | "catalog" | "blog" | "story" | "contact";
  productOptions: string[];
}) {
  const linkClass = (name: "home" | "catalog" | "blog" | "story" | "contact") =>
    `border-b-2 pb-1 transition-colors ${
      active === name
        ? "border-[#E46414] text-white"
        : "border-transparent text-white/70 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/12 bg-[#061d2b]/90 backdrop-blur">
      <div className="flex min-h-[84px] flex-col gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <Link href="/" className="flex items-center gap-4">
          <Image src={marketingAsset("Logo.png")} alt="ExEC" width={54} height={54} className="h-[54px] w-[54px] object-contain" />
          <div className="border-l border-white/20 pl-4 leading-none">
            <div className="font-[family-name:var(--font-marketing-display)] text-2xl tracking-wide">EXEC</div>
            <div className="-mt-1 max-w-[230px] font-[family-name:var(--font-marketing-mono)] text-[9.5px] uppercase tracking-[0.22em] text-white/55">
              Explosion Proof <br/>Electrical Control
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-semibold uppercase tracking-[0.16em] lg:gap-x-10">
          <Link href="/" className={linkClass("home")}>Home</Link>
          <Link href="/catalog" className={linkClass("catalog")}>Catalog</Link>
          <Link href="/blog" className={linkClass("blog")}>Blog</Link>
          <Link href="/story" className={linkClass("story")}>Our Story</Link>
          <Link href="/contact" className={linkClass("contact")}>Contact</Link>
        </nav>

        <RequestQuoteModal productOptions={productOptions} />
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="bg-[#04121b]">
      <div className="grid gap-10 px-5 py-14 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-14 lg:py-[74px]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Image src={marketingAsset("Logo.png")} alt="ExEC" width={48} height={48} className="h-12 w-12 object-contain" />
            <div className="font-[family-name:var(--font-marketing-display)] text-[26px] tracking-wide">EXEC</div>
          </div>
          <p className="max-w-[320px] text-sm font-light leading-7 text-white/60">
            Explosion Proof Electrical Control: flameproof junction boxes, lighting, panels and instrumentation for hazardous areas. Engineered in Vapi, Gujarat since 1996.
          </p>
        </div>
        <FooterColumn title="Explore" links={[["Home", "/"], ["Catalog", "/catalog"], ["Blog", "/blog"], ["Our Story", "/story"], ["Contact", "/contact"]]} />
        <FooterColumn title="Products" links={[["Light Fittings", "/catalog?cat=lighting"], ["Control Panels", "/catalog?cat=control-panels"], ["Junction Boxes", "/catalog?cat=enclosures"], ["Instrumentation", "/catalog?cat=instrumentation"]]} />
        <div>
          <FooterHeading>Reach Us</FooterHeading>
          <div className="flex flex-col gap-3 text-sm leading-6 text-white/70">
            <span>GIDC Phase IV, Vapi<br />Gujarat 396195, India</span>
            <a href="mailto:info@explosionproofelectrical.com">info@explosionproofelectrical.com</a>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/12 px-5 py-6 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.12em] text-white/45 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14">
        <span>© {new Date().getFullYear()} Explosion Proof Electrical Control / All Rights Reserved</span>
        <span>CIMFR & PESO Certified / IP-66 / Ex d IIA-IIB-IIC</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <div className="flex flex-col gap-3 text-sm text-white/70">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="hover:text-white">{label}</Link>
        ))}
      </div>
    </div>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] text-[#F17D1E]">
      {children}
    </div>
  );
}
