import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/marketing/BlogCard";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { getPost, posts } from "@/lib/marketing/data";

interface ArticlePageProps {
  params: Promise<{ postSlug: string }>;
}

export function generateStaticParams() {
  return posts.map((post) => ({ postSlug: post.slug }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { postSlug } = await params;
  const post = getPost(postSlug);

  if (!post) {
    notFound();
  }

  const morePosts = posts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <MarketingShell active="blog">
      <article>
        <section className="relative flex min-h-[420px] items-end overflow-hidden border-b border-white/12">
          <Image src={post.image} alt="" fill priority className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04121b] via-[#04121b]/75 to-[#04121b]/30" />
          <div className="relative px-5 py-12 sm:px-10 lg:px-[60px] lg:py-[74px]">
            <div className="mb-6 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.16em] text-white/60">
              <Link href="/" className="text-[#F17D1E]">Home</Link> &nbsp;/&nbsp; <Link href="/blog">Blog</Link>
            </div>
            <div className="mb-5 font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.18em] text-[#F17D1E]">
              {post.cat} / {post.date} / {post.read}
            </div>
            <h1 className="max-w-5xl font-[family-name:var(--font-marketing-display)] text-6xl uppercase leading-none sm:text-[84px]">
              {post.title}
            </h1>
          </div>
        </section>

        <section className="grid border-b border-white/12 lg:grid-cols-[0.74fr_1.26fr]">
          <aside className="border-r border-white/12 p-8 lg:p-[60px]">
            <div className="font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.16em] text-[#F17D1E]">Article Brief</div>
            <p className="mt-5 text-base font-light leading-7 text-white/70">{post.excerpt}</p>
            <Link href="/blog" className="mt-8 inline-block border-b border-[#E46414] pb-1 text-xs font-semibold uppercase tracking-[0.1em]">
              ← Back to All Articles
            </Link>
          </aside>
          <div className="p-8 lg:p-[60px]">
            <div className="max-w-3xl space-y-7 text-lg font-light leading-8 text-white/75">
              {post.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      </article>

      <section>
        <div className="px-5 py-14 sm:px-10 lg:px-[60px]">
          <h2 className="font-[family-name:var(--font-marketing-display)] text-5xl uppercase leading-none sm:text-[54px]">More Articles</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3">
          {morePosts.map((item) => (
            <BlogCard key={item.slug} post={item} />
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
