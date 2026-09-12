"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/dashboard/global/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
            <div className="space-y-2"><Label htmlFor="content">Article content</Label><Textarea id="content" className="min-h-[460px] font-mono text-sm leading-6" value={values.content} onChange={(e) => set("content", e.target.value)} placeholder={"Start with a strong introduction.\n\n## Add a section heading\n\nExplain the topic in practical detail.\n\n- Use bullet points where useful\n- Keep each paragraph focused"} />{field("content")}<p className="text-xs text-muted-foreground">Use blank lines for paragraphs, <code>##</code> for headings, and <code>-</code> for bullet lists.</p></div>
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
