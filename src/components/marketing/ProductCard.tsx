import Image from "next/image";
import Link from "next/link";

export type ProductCardProduct = {
  slug: string;
  name: string;
  cat: string;
  image: string;
  ip: string;
  group: string;
  type: string;
  filter: string;
};

type ProductCardProps = {
  product: ProductCardProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const flameImage = product.image.endsWith("flame.png");

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="group flex min-h-[440px] flex-col border-b border-r border-white/12 bg-[#061d2b] transition-colors hover:bg-[#082739]">
      <div className="relative flex h-[250px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#0c3145_0%,#061d2b_70%)]">
        <div className="absolute left-5 top-5 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.14em] text-white/40">
          {product.type}
        </div>
        <Image
          src={product.image}
          alt={product.name}
          width={flameImage ? 300 : 360}
          height={flameImage ? 220 : 190}
          className={`${flameImage ? "h-[220px] w-[88%]" : "h-[190px] w-[74%]"} object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105`}
        />
      </div>
      <div className="flex flex-1 flex-col p-7">
        <div className="font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.14em] text-[#F17D1E]">
          {product.cat}
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-marketing-display)] text-[32px] uppercase leading-none tracking-wide">
          {product.name}
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/12 py-4 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.12em] text-white/60">
          <span>{product.ip}</span>
          <span>{product.group}</span>
        </div>
        <div className="mt-auto pt-6 text-xs font-semibold uppercase tracking-[0.1em] text-white">
          <span className="border-b border-[#E46414] pb-1">View Product</span>
        </div>
      </div>
    </Link>
  );
}
