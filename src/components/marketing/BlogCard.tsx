import Image from "next/image";
import Link from "next/link";
import { MarketingPost } from "@/lib/marketing/data";

type BlogCardProps = {
  post: MarketingPost;
  featured?: boolean;
};

export function BlogCard({ post, featured = false }: BlogCardProps) {
  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group grid border-t border-white/12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[380px] overflow-hidden border-r border-white/12">
          <Image src={post.image} alt="" fill className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04121b]/30 to-[#04121b]/70" />
        </div>
        <div className="flex flex-col justify-center bg-[#061d2b] p-8 lg:p-12">
          <Meta post={post} />
          <h2 className="mt-5 font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-6xl">
            {post.title}
          </h2>
          <p className="mt-5 max-w-xl text-base font-light leading-7 text-white/65">{post.excerpt}</p>
          <span className="mt-8 w-fit border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">
            Read Article →
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group flex min-h-[430px] flex-col border-b border-r border-white/12 bg-[#061d2b] transition-colors hover:bg-[#082739]">
      <div className="relative h-[210px] overflow-hidden">
        <Image src={post.image} alt="" fill className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-5 top-5 bg-[#E46414] px-3 py-2 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.12em]">
          {post.cat}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-[family-name:var(--font-marketing-display)] text-[30px] uppercase leading-none">{post.title}</h3>
        <p className="mt-4 text-sm font-light leading-6 text-white/60">{post.excerpt}</p>
        <div className="mt-auto pt-6">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}

function Meta({ post }: { post: MarketingPost }) {
  return (
    <div className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-marketing-mono)] text-[10px] uppercase tracking-[0.12em] text-white/50">
      <span>{post.cat}</span>
      <span className="text-white/25">/</span>
      <span>{post.date}</span>
      <span className="text-white/25">/</span>
      <span>{post.read}</span>
    </div>
  );
}
