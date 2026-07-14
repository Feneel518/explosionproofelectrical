import Image from "next/image";
import Link from "next/link";
import { BlogCard } from "@/components/marketing/BlogCard";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ProductCard } from "@/components/marketing/ProductCard";
import type { ProductCardProduct } from "@/components/marketing/ProductCard";
import { marketingAsset, pillars, posts } from "@/lib/marketing/data";
import {
  formatGasGroupLabel,
  formatProtectionLabel,
} from "@/lib/marketing/catalog";
import { prisma } from "@/lib/prisma/db";

type HomeCategoryCard = {
  code: string;
  name: string;
  description: string;
  spec: string;
  image: string;
  imageClassName: string;
  href: string;
};

const fallbackCategoryImages = [
  marketingAsset("wellglass.png"),
  marketingAsset("panel.png"),
  marketingAsset("flood.png"),
  marketingAsset("Tubeloight.png"),
  marketingAsset("flame.png"),
  marketingAsset("sketchfl.png"),
];

const homeCategoryIds = [
  "1efa6fba-5ced-4a25-8d56-846b5e563aab",
  "62c12e90-b13d-4b23-979c-9c63055d2b36",
  "77219481-298f-48a6-8d2f-ac109e5c9bd5",
  "b6cb625c-57a6-48e2-9d71-73b7cce1eb5f",
  "edf8100d-29c4-4dfe-a88c-edb91b468d4d",
  "aacacb9b-fc45-43bb-bc43-c126b22fb5a0",
];

export default async function Home() {
  const [categoryCards, featuredProducts] = await Promise.all([
    getHomeCategoryCards(),
    getHomeFeaturedProducts(),
  ]);

  return (
    <MarketingShell active="home">
      <section className="relative overflow-hidden border-b border-white/12">
        <Image src={marketingAsset("factory.jpg")} alt="" fill priority className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#04121b_30%,rgba(7,37,54,0.72)_70%,rgba(7,37,54,0.35)_100%)]" />
        <div className="absolute right-[-180px] top-[6%] h-[760px] w-[760px] animate-pulse bg-[radial-gradient(circle,rgba(228,100,20,0.30)_0%,rgba(228,100,20,0)_62%)] blur-lg" />

        <div className="relative grid min-h-[calc(100vh-126px)] items-center gap-12 px-5 py-16 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-[72px] lg:py-20">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 border border-[#E46414]/45 px-4 py-2 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.2em] text-[#F17D1E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E46414] shadow-[0_0_10px_#E46414]" />
              CIMFR & PESO Certified / Zone 1 & Zone 2
            </div>
            <h1 className="font-[family-name:var(--font-marketing-display)] text-[72px] uppercase leading-[0.88] tracking-normal sm:text-[92px] xl:text-[104px]">
              Built to<br />Contain<br /><span className="text-[#E46414]">The Spark.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg font-light leading-8 text-white/75">
              Flameproof and explosion-proof electrical equipment engineered for the world&apos;s most hazardous environments. Designed, cast and certified in Vapi since 1996.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/catalog" className="bg-[#E46414] px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] shadow-[0_12px_40px_rgba(228,100,20,0.34)]">
                Browse Catalog →
              </Link>
              <a href="#story" className="border border-white/35 px-8 py-4 text-sm font-semibold uppercase tracking-[0.1em]">
                Download Brochure ↓
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-[380px] w-[380px] bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_65%)]" />
            <Image
              src={marketingAsset("wellglass.png")}
              alt="Flameproof wellglass light fitting"
              width={430}
              height={430}
              priority
              className="relative max-h-[430px] w-full max-w-[430px] animate-[floatY_7s_ease-in-out_infinite] object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]"
            />
            <div className="absolute bottom-8 right-0 border border-white/16 bg-[#061d2b] p-4 font-[family-name:var(--font-marketing-mono)]">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Model</div>
              <div className="mt-1 text-base tracking-[0.06em]">EXEC L-45</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#F17D1E]">IP-66 / Ex d IIB</div>
            </div>
          </div>
        </div>
      </section>

      <TrustAndStats />
      <CategoriesSection categories={categoryCards} />
      <WhyChooseSection />
      <CapabilitySection />
      <MissionSection />
      <FeaturedProducts products={featuredProducts} />
      <BlogPreview />
      <CtaBand />
    </MarketingShell>
  );
}

async function getHomeCategoryCards(): Promise<HomeCategoryCard[]> {
  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: homeCategoryIds,
      },
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      products: {
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          protection: true,
          gasGroup: true,
          variants: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
            select: {
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const orderedCategories = [...categories].sort(
    (a, b) => homeCategoryIds.indexOf(a.id) - homeCategoryIds.indexOf(b.id),
  );

  return orderedCategories.map((category, index) => {
    const product = category.products[0];
    const productImage = product?.variants[0]?.images[0]?.url?.trim();
    const image = productImage ?? fallbackCategoryImages[index % fallbackCategoryImages.length];

    return {
      code: `CAT-${String(index + 1).padStart(2, "0")}`,
      name: category.name,
      description:
        category.description?.trim() ||
        "Certified flameproof equipment engineered for hazardous-area installations.",
      spec: formatCategorySpec(product?.protection, product?.gasGroup),
      image,
      imageClassName: image.endsWith("flame.png") ? "h-[260px] w-[90%]" : "h-[210px] w-[78%]",
      href: `/catalog?cat=${category.slug}`,
    };
  });
}

function formatCategorySpec(protection?: string | null, gasGroup?: string | null) {
  const protectionLabel = formatProtectionLabel(protection);
  const gasGroupLabel = formatGasGroupLabel(gasGroup);

  if (protectionLabel && gasGroupLabel) return `${protectionLabel} / ${gasGroupLabel}`;
  if (protectionLabel) return protectionLabel;
  if (gasGroupLabel) return gasGroupLabel;
  return "IP-66 / Ex d IIB";
}

async function getHomeFeaturedProducts(): Promise<ProductCardProduct[]> {
  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: homeCategoryIds,
      },
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      products: {
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          name: true,
          slug: true,
          flpType: true,
          protection: true,
          gasGroup: true,
          variants: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
            select: {
              typeNumber: true,
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const orderedCategories = [...categories].sort(
    (a, b) => homeCategoryIds.indexOf(a.id) - homeCategoryIds.indexOf(b.id),
  );

  return orderedCategories.flatMap((category, index) => {
    const product = category.products[0];
    if (!product) return [];

    const variant = product.variants[0];
    const image =
      variant?.images[0]?.url?.trim() ||
      fallbackCategoryImages[index % fallbackCategoryImages.length];
    return {
      slug: product.slug,
      name: product.name,
      cat: category.name,
      image,
      ip: formatProtectionLabel(product.protection) || "IP-66",
      group: formatGasGroupLabel(product.gasGroup) || "Ex d IIB",
      type: variant?.typeNumber?.trim() || product.flpType?.trim() || "EXEC",
      filter: category.slug,
    };
  });
}

function TrustAndStats() {
  return (
    <>
      <section className="grid border-b border-white/12 bg-[#061d2b] sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["CIMFR", "Test & Approval", "Certified"],
          ["IP-66", "Dust & Jet", "Ingress Rated"],
          ["PESO", "Approved For", "Hazardous Areas"],
          ["Ex d", "IIA / IIB / IIC", "Gas Groups"],
        ].map(([big, line1, line2], index) => (
          <div key={big} className="flex items-center gap-4 border-b border-r border-white/12 p-7">
            <div className={`font-[family-name:var(--font-marketing-display)] text-[46px] leading-none ${index % 2 === 0 ? "text-[#E46414]" : "text-white"}`}>{big}</div>
            <div className="font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase leading-5 tracking-[0.14em] text-white/60">{line1}<br />{line2}</div>
          </div>
        ))}
      </section>
      <section className="grid border-b border-white/12 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["28+", "Years of Flameproof", "Engineering"],
          ["100+", "Certified Product", "Types"],
          ["2", "Hazardous Zones", "1 & 2 Rated"],
          ["PAN·", "India Supply", "Network"],
        ].map(([big, line1, line2]) => (
          <div key={line1} className="border-b border-r border-white/12 p-10 text-center lg:p-[74px_28px]">
            <div className="font-[family-name:var(--font-marketing-display)] text-[78px] leading-none">{big.includes("+") ? big.slice(0, -1) : big}<span className="text-[#E46414]">{big.includes("+") ? "+" : big.endsWith("·") ? "·" : ""}</span></div>
            <div className="mt-3 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase leading-5 tracking-[0.16em] text-white/60">{line1}<br />{line2}</div>
          </div>
        ))}
      </section>
    </>
  );
}

function CategoriesSection({ categories }: { categories: HomeCategoryCard[] }) {
  return (
    <section className="border-b border-white/12">
      <div className="flex flex-wrap items-end justify-between gap-6 px-5 py-14 sm:px-10 lg:px-[60px] lg:pb-12 lg:pt-20">
        <div>
          <SectionKicker>/ What We Build</SectionKicker>
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[68px]">A Complete Flameproof Range</h2>
        </div>
        <Link href="/catalog" className="border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">View Full Catalog →</Link>
      </div>
      <div className="grid border-t border-white/12 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.code} href={cat.href} className="group border-b border-r border-white/12">
            <div className="relative flex h-[300px] items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#0c3145_0%,#061d2b_70%)]">
              <span className="absolute left-5 top-5 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.14em] text-white/40">{cat.code}</span>
              <Image src={cat.image} alt={cat.name} width={380} height={260} className={`${cat.imageClassName} object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105`} />
            </div>
            <div className="p-7">
              <h3 className="font-[family-name:var(--font-marketing-display)] text-[30px] uppercase leading-none">{cat.name}</h3>
              <p className="mt-3 text-sm font-light leading-6 text-white/60">{cat.description}</p>
              <div className="mt-5 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.12em] text-[#F17D1E]">{cat.spec} <span className="text-white/40">→</span></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function WhyChooseSection() {
  return (
    <section id="story" className="grid border-b border-white/12 bg-[#061d2b] lg:grid-cols-[0.9fr_1.1fr]">
      <div className="border-r border-white/12 p-8 lg:p-[74px_50px]">
        <SectionKicker>/ Why EXEC</SectionKicker>
        <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[62px]">Safety Engineered<br />Into Every Casting</h2>
        {/* <Image src={marketingAsset("flame.png")} alt="" width={300} height={300} className="mt-12 opacity-90 drop-shadow-[0_0_30px_rgba(228,100,20,0.4)]" /> */}
        <p className="mt-8 max-w-md text-sm font-light leading-7 text-white/65">Every enclosure is pressure-tested to contain an internal explosion and prevent ignition of the surrounding atmosphere: the core principle of flameproof protection.</p>
      </div>
      <div className="grid sm:grid-cols-2">
        {pillars.map((pillar) => (
          <div key={pillar.num} className="border-b border-r border-white/12 p-8 lg:p-10 xl:p-12">
            <div className="font-[family-name:var(--font-marketing-display)] text-[40px] leading-none text-[#E46414]">{pillar.num}</div>
            <div className="mt-4 font-[family-name:var(--font-marketing-display)] text-[28px] uppercase tracking-wide">{pillar.title}</div>
            <p className="mt-3 text-sm font-light leading-6 text-white/60">{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CapabilitySection() {
  return (
    <section className="grid border-b border-white/12 lg:grid-cols-2">
      <div className="border-r border-white/12 p-8 lg:p-[90px_60px]">
        <SectionKicker>/ Custom Control Panels</SectionKicker>
        <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[64px]">From a Single<br />Junction Box to a<br />Full Control Room</h2>
        <p className="mt-6 max-w-xl text-base font-light leading-7 text-white/70">We design and fabricate flameproof control and instrumentation panels to spec: pressure, level and motor control built into a single explosion-proof enclosure, wired, tested and certified before it leaves the floor.</p>
        <div className="mt-10 flex flex-wrap gap-10">
          <Spec title="Ex d" label="Enclosure Type" />
          <Spec title="Built-to-Spec" label="Every Order" />
        </div>
      </div>
      <div className="relative flex min-h-[520px] items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#0c3145_0%,#04121b_75%)] p-8">
        <div className="absolute right-7 top-6 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.16em] text-white/40">Fig. 02 - Control Panel</div>
        <Image src={marketingAsset("panel.png")} alt="Flameproof control panel" width={520} height={520} className="max-h-[520px] w-auto max-w-[90%] object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]" />
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="grid items-center border-b border-white/12 bg-[#061d2b] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="border-r border-white/12 p-8 lg:p-[90px_60px]">
        <SectionKicker>/ Our Mission</SectionKicker>
        <p className="font-[family-name:var(--font-marketing-display)] text-4xl uppercase leading-tight sm:text-[42px]">
          &quot;To keep India&apos;s most demanding plants, their people, assets and facilities safe from the smallest spark.&quot;
        </p>
      </div>
      <div className="flex min-h-[360px] items-center justify-center p-10">
        <Image src={marketingAsset("india.png")} alt="India supply network" width={320} height={320} className="max-h-[320px] w-auto object-contain opacity-90" />
      </div>
    </section>
  );
}

function FeaturedProducts({ products }: { products: ProductCardProduct[] }) {
  return (
    <section className="border-b border-white/12">
      <div className="flex flex-wrap items-end justify-between gap-6 px-5 py-14 sm:px-10 lg:px-[60px]">
        <div>
          <SectionKicker>/ Catalog Preview</SectionKicker>
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[62px]">Products Built for Hazardous Areas</h2>
        </div>
        <Link href="/catalog" className="border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">All Products →</Link>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => <ProductCard key={product.slug} product={product} />)}
      </div>
    </section>
  );
}

function BlogPreview() {
  return (
    <section className="border-b border-white/12 bg-[#061d2b]">
      <div className="flex flex-wrap items-end justify-between gap-6 px-5 py-14 sm:px-10 lg:px-[60px]">
        <div>
          <SectionKicker>/ Field Notes</SectionKicker>
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[62px]">Hazardous Area Thinking</h2>
        </div>
        <Link href="/blog" className="border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">Read Blog →</Link>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3">
        {posts.slice(0, 3).map((post) => <BlogCard key={post.slug} post={post} />)}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="relative overflow-hidden border-b border-white/12 px-5 py-20 text-center sm:px-10 lg:py-28">
      <Image src={marketingAsset("factory.jpg")} alt="" fill className="object-cover opacity-15" />
      <div className="absolute inset-0 bg-[#04121b]/70" />
      <div className="relative mx-auto max-w-4xl">
        <SectionKicker>/ Ready for the Next Specification</SectionKicker>
        <h2 className="font-[family-name:var(--font-marketing-display)] text-6xl uppercase leading-none sm:text-[84px]">Specify Flameproof With Confidence</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-7 text-white/70">Browse certified products and shortlist the equipment your hazardous area actually needs.</p>
        <Link href="/catalog" className="mt-10 inline-block bg-[#E46414] px-9 py-5 text-sm font-bold uppercase tracking-[0.1em] shadow-[0_14px_44px_rgba(228,100,20,0.4)]">Browse Catalog →</Link>
      </div>
    </section>
  );
}

function SectionKicker({ children }: { children: string }) {
  return <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">{children}</div>;
}

function Spec({ title, label }: { title: string; label: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-marketing-display)] text-[34px] uppercase leading-none">{title}</div>
      <div className="mt-2 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.14em] text-white/55">{label}</div>
    </div>
  );
}
