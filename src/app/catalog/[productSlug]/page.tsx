import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ProductCard } from "@/components/marketing/ProductCard";
import { getCatalogProductDetail } from "@/lib/marketing/catalog";

interface ProductPageProps {
  params: Promise<{ productSlug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params;
  const catalogProduct = await getCatalogProductDetail(productSlug);

  if (!catalogProduct) {
    notFound();
  }

  const { product, related } = catalogProduct;
  const specs = [
    ["Type No.", product.type],
    ["Certification", "CIMFR Tested / PESO Approved"],
    ["Protection Concept", product.gasGroup || product.group],
    ["Ingress Protection", product.ip],
    ["Enclosure", product.material || "LM-6 Aluminium Alloy, Pressure Die-Cast"],
    ["Finish", product.finish || "Epoxy Powder Coated"],
    ["Hardware", product.hardware || "Stainless Steel 316"],
    ["Zones", product.zones.length ? product.zones.join(" / ") : "Zone 1 / Zone 2"],
    ["HSN Code", product.hsnCode || "-"],
  ] satisfies [string, string][];
  const features = [
    "Tested to contain an internal explosion without external ignition",
    "Certified for Zone 1 and Zone 2 gas-group hazardous areas",
    `Weatherproof to ${product.ip}: dust-tight and jet-proof`,
    "Heavy die-cast body built for corrosive industrial service",
  ];

  return (
    <MarketingShell active="catalog">
      <section className="grid border-b border-white/12 lg:grid-cols-2">
        <div className="flex min-h-[620px] items-center justify-center border-r border-white/12 bg-[radial-gradient(circle_at_50%_40%,#0c3145_0%,#04121b_75%)] p-8">
          <Image
            src={product.image}
            alt={product.name}
            width={620}
            height={520}
            priority
            className="max-h-[520px] w-auto max-w-[90%] object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.62)]"
          />
        </div>
        <div className="p-8 lg:p-[74px_60px]">
          <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.16em] text-white/50">
            <Link href="/" className="text-[#F17D1E]">Home</Link> &nbsp;/&nbsp; <Link href="/catalog">Catalog</Link> &nbsp;/&nbsp; {product.cat}
          </div>
          <div className="mb-4 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.18em] text-[#F17D1E]">{product.type}</div>
          <h1 className="font-[family-name:var(--font-marketing-display)] text-6xl uppercase leading-none sm:text-[84px]">
            {product.name}
          </h1>
          <p className="mt-7 max-w-xl text-base font-light leading-7 text-white/70">
            {product.description}
          </p>
          <div className="mt-8 grid grid-cols-2 border border-white/12">
            {specs.map(([key, value]) => (
              <div key={key} className="border-b border-r border-white/12 p-4">
                <div className="font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.14em] text-white/45">{key}</div>
                <div className="mt-2 text-sm text-white/85">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <div className="font-[family-name:var(--font-marketing-display)] text-[34px] uppercase leading-none">Core Features</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/65">
              {features.map((feature) => (
                <li key={feature} className="flex gap-3"><span className="text-[#E46414]">&bull;</span>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-6 px-5 py-14 sm:px-10 lg:px-[60px]">
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[54px]">Related Products</h2>
          <Link href="/catalog" className="border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">All Products &rarr;</Link>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
