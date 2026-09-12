import Link from "next/link";
import { BlogCard } from "@/components/marketing/BlogCard";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { getPublishedBlogPosts } from "@/lib/marketing/blog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Flameproof Engineering Blog",
  description: "Practical guides about hazardous-area classification, flameproof equipment, PESO and CIMFR certification, lighting, installation and maintenance.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const [featured, ...gridPosts] = posts;

  return (
    <MarketingShell active="blog">
      <section className="border-b border-white/12 bg-[#061d2b] px-5 py-14 sm:px-10 lg:px-[60px] lg:py-[74px]">
        <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.18em] text-white/55">
          <Link href="/" className="text-[#F17D1E]">Home</Link> &nbsp;/&nbsp; Blog
        </div>
        <h1 className="font-[family-name:var(--font-marketing-display)] text-6xl uppercase leading-none sm:text-[84px]">
          Field Notes
        </h1>
        <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/70">
          Practical notes on hazardous-area classification, flameproof protection, certification and maintenance.
        </p>
      </section>

      {featured ? <BlogCard post={featured} featured /> : <div className="border-b border-white/12 px-6 py-20 text-center text-white/60">Engineering notes are coming soon.</div>}

      <section className="grid md:grid-cols-2 xl:grid-cols-3">
        {gridPosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </section>
    </MarketingShell>
  );
}
