"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Eye, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/dashboard/blog/RichTextEditor";
import { FileUpload } from "@/components/dashboard/global/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveBlogPostAction } from "@/lib/actions/dashboard/blog/blogActions";
import type { BlogPostInput } from "@/lib/validators/dashboard/blog/BlogPostValidator";

type EditorPost = BlogPostInput & { id: string };

const emptyPost: BlogPostInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Engineering",
  coverImage: "",
  coverImageAlt: "",
  authorName: "ExEC Engineering Team",
  status: "DRAFT",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  keywords: [],
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function BlogPostEditor({ post }: { post?: EditorPost }) {
  const router = useRouter();
  const [values, setValues] = useState<BlogPostInput>(post ?? emptyPost);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = (status: "DRAFT" | "PUBLISHED") => {
    startTransition(async () => {
      const result = await saveBlogPostAction(post?.id ?? null, { ...values, status });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/dashboard/blog");
      router.refresh();
    });
  };

  const field = (name: keyof BlogPostInput) => errors[name]?.[0] ? <p className="text-xs text-destructive">{errors[name][0]}</p> : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild><Link href="/dashboard/blog"><ArrowLeft /></Link></Button>
          <div><h1 className="text-2xl font-semibold tracking-tight">{post ? "Edit article" : "New article"}</h1><p className="text-sm text-muted-foreground">Write once, then publish it to the homepage and blog.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {post?.status === "PUBLISHED" && <Button variant="outline" asChild><Link href={`/blog/${post.slug}`} target="_blank">View live <ExternalLink /></Link></Button>}
          <Dialog>
            <DialogTrigger asChild><Button type="button" variant="outline"><Eye /> Preview article</Button></DialogTrigger>
            <BlogPostPreview values={values} />
          </Dialog>
          <Button variant="outline" disabled={pending} onClick={() => submit("DRAFT")}><Save /> Save draft</Button>
          <Button disabled={pending} onClick={() => submit("PUBLISHED")}>{pending ? "Saving…" : "Publish article"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Article</CardTitle><CardDescription>The headline and opening summary readers see first.</CardDescription></CardHeader><CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={values.title} maxLength={120} onChange={(e) => { const title = e.target.value; setValues((current) => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title), coverImageAlt: current.coverImageAlt || title })); }} placeholder="How to select a flameproof junction box" />{field("title")}</div>
            <div className="space-y-2"><Label htmlFor="slug">URL slug</Label><div className="flex items-center rounded-md border bg-background pl-3 text-sm text-muted-foreground"><span>/blog/</span><Input id="slug" className="border-0 shadow-none focus-visible:ring-0" value={values.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div>{field("slug")}</div>
            <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="excerpt">Excerpt</Label><span className="text-xs text-muted-foreground">{values.excerpt.length}/320</span></div><Textarea id="excerpt" rows={4} maxLength={320} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="A clear summary that makes the reader want to continue." />{field("excerpt")}</div>
            <div className="space-y-2"><Label htmlFor="content">Article content</Label><RichTextEditor value={values.content} onChange={(content) => set("content", content)} />{field("content")}</div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Search appearance</CardTitle><CardDescription>Optional overrides. If left blank, the article title and excerpt are used.</CardDescription></CardHeader><CardContent className="space-y-5">
            <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="seoTitle">SEO title</Label><span className="text-xs text-muted-foreground">{values.seoTitle?.length ?? 0}/70</span></div><Input id="seoTitle" maxLength={70} value={values.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} />{field("seoTitle")}</div>
            <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="seoDescription">Meta description</Label><span className="text-xs text-muted-foreground">{values.seoDescription?.length ?? 0}/170</span></div><Textarea id="seoDescription" rows={3} maxLength={170} value={values.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />{field("seoDescription")}</div>
            <div className="space-y-2"><Label htmlFor="keywords">Search keywords</Label><Input id="keywords" value={values.keywords.join(", ")} onChange={(e) => set("keywords", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="flameproof junction box, hazardous area" /><p className="text-xs text-muted-foreground">Separate phrases with commas.</p>{field("keywords")}</div>
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Publishing</CardTitle></CardHeader><CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="category">Category</Label><Input id="category" value={values.category} onChange={(e) => set("category", e.target.value)} placeholder="Standards" />{field("category")}</div>
            <div className="space-y-2"><Label htmlFor="author">Author</Label><Input id="author" value={values.authorName} onChange={(e) => set("authorName", e.target.value)} />{field("authorName")}</div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"><Checkbox checked={values.featured} onCheckedChange={(checked) => set("featured", checked === true)} /><span><span className="block text-sm font-medium">Feature on homepage</span><span className="block text-xs leading-5 text-muted-foreground">Featured articles appear first.</span></span></label>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Cover image</CardTitle><CardDescription>Use a wide industrial image, ideally 1600 × 900.</CardDescription></CardHeader><CardContent className="space-y-4">
            <FileUpload endpoint="blogCover" kind="IMAGE" value={values.coverImage ? [{ kind: "IMAGE", url: values.coverImage, title: values.coverImageAlt }] : []} onChange={(files) => set("coverImage", files.at(-1)?.url ?? "")} />
            {field("coverImage")}
            <div className="space-y-2"><Label htmlFor="coverAlt">Image description</Label><Textarea id="coverAlt" rows={3} maxLength={180} value={values.coverImageAlt} onChange={(e) => set("coverImageAlt", e.target.value)} placeholder="Technician inspecting a flameproof enclosure" />{field("coverImageAlt")}</div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function BlogPostPreview({ values }: { values: BlogPostInput }) {
  const title = values.title.trim() || "Your article title will appear here";
  const excerpt = values.excerpt.trim() || "Your article summary will appear here as you write it.";
  const category = values.category.trim() || "Engineering";
  const author = values.authorName.trim() || "ExEC Engineering Team";
  const words = values.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.ceil(words / 210))} min read`;
  const previewDate = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

  return (
    <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-6xl overflow-y-auto border-white/15 bg-[#04121b] p-0 text-white sm:p-0">
      <DialogTitle className="sr-only">Article preview</DialogTitle>
      <DialogDescription className="sr-only">A live preview of the article as it will appear on the public website.</DialogDescription>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/15 bg-[#072436]/95 px-5 py-3 backdrop-blur">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f17d1e]">Draft preview</p>
          <p className="mt-0.5 text-xs text-white/55">Updates live as you edit. Nothing is published yet.</p>
        </div>
      </div>

      <article>
        <section className="relative flex min-h-[390px] items-end overflow-hidden border-b border-white/15">
          {values.coverImage ? (
            // The URL comes from the same validated upload field used by the public article.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.coverImage} alt={values.coverImageAlt || title} className="absolute inset-0 h-full w-full object-cover opacity-35" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0b344d,#061d2b_52%,#e46414_140%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#04121b] via-[#04121b]/75 to-[#04121b]/25" />
          <div className="relative w-full px-6 py-12 sm:px-10 lg:px-14">
            <div className="mb-5 text-[11px] uppercase tracking-[0.18em] text-[#f17d1e]">{category} / {previewDate} / {readTime}</div>
            <h1 className="max-w-5xl text-5xl font-medium uppercase leading-[0.95] tracking-[-0.055em] text-balance sm:text-7xl lg:text-[84px]">{title}</h1>
          </div>
        </section>

        <section className="grid lg:grid-cols-[0.74fr_1.26fr]">
          <aside className="border-b border-white/15 p-7 lg:border-r lg:border-b-0 lg:p-12">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f17d1e]">Article brief</p>
            <p className="mt-5 text-base font-light leading-7 text-white/70">{excerpt}</p>
            <p className="mt-6 text-[11px] uppercase tracking-[0.12em] text-white/45">By {author}</p>
          </aside>
          <div className="p-7 lg:p-12">
            {values.content.trim() ? (
              <PreviewContent content={values.content} />
            ) : (
              <div className="rounded border border-dashed border-white/20 px-6 py-16 text-center text-sm text-white/45">Start writing to preview the article body.</div>
            )}
          </div>
        </section>
      </article>
    </DialogContent>
  );
}

function PreviewContent({ content }: { content: string }) {
  if (isHtmlContent(content)) {
    return <div className="max-w-3xl space-y-7 overflow-hidden text-lg font-light leading-8 text-white/75 [&_h2]:pt-5 [&_h2]:text-4xl [&_h2]:font-medium [&_h2]:uppercase [&_h2]:leading-tight [&_h2]:tracking-[-0.04em] [&_h2]:text-white [&_h3]:pt-5 [&_h3]:text-3xl [&_h3]:font-medium [&_h3]:uppercase [&_h3]:leading-tight [&_h3]:tracking-[-0.04em] [&_h3]:text-white [&_h4]:pt-3 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-white [&_p]:text-white/75 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:marker:text-[#f17d1e] [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-2 [&_blockquote]:border-[#f17d1e] [&_blockquote]:bg-white/5 [&_blockquote]:p-4 [&_blockquote]:text-white/80 [&_a]:text-[#b8def7] [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_em]:italic [&_mark]:rounded-sm [&_mark]:bg-[#f17d1e]/30 [&_mark]:px-1 [&_mark]:text-white [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-black/30 [&_pre]:p-5 [&_pre]:text-sm [&_table]:min-w-[560px] [&_table]:border-collapse [&_table]:text-sm [&_.tableWrapper]:overflow-x-auto [&_th]:border [&_th]:border-white/15 [&_th]:bg-white/10 [&_th]:p-3 [&_td]:border [&_td]:border-white/15 [&_td]:p-3" dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const blocks = content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="max-w-3xl space-y-7 text-lg font-light leading-8 text-white/75">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) return <h2 key={index} className="pt-5 text-4xl font-medium uppercase leading-tight tracking-[-0.04em] text-white">{block.slice(3)}</h2>;
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.every((line) => line.startsWith("- "))) return <ul key={index} className="list-disc space-y-2 pl-6 marker:text-[#f17d1e]">{lines.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{line.slice(2)}</li>)}</ul>;
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

function isHtmlContent(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}
