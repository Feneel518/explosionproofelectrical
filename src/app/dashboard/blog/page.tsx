import Image from "next/image";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteBlogPostButton } from "@/components/dashboard/blog/DeleteBlogPostButton";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function DashboardBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: [{ featured: "desc" }, { updatedAt: "desc" }] });
  const published = posts.filter((post) => post.status === "PUBLISHED").length;
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Blog</h1><p className="text-sm text-muted-foreground">Publish helpful engineering content to the website.</p></div><Button asChild><Link href="/dashboard/blog/new"><Plus /> New article</Link></Button></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Total articles" value={posts.length} /><Metric label="Published" value={published} /><Metric label="Drafts" value={posts.length - published} /></div>
    <Card><CardContent className="px-0">
      {posts.length === 0 ? <div className="flex flex-col items-center px-6 py-16 text-center"><div className="mb-4 rounded-full bg-muted p-4"><FileText className="size-7" /></div><h2 className="font-semibold">No articles yet</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Create your first practical guide and publish it to the homepage.</p><Button className="mt-5" asChild><Link href="/dashboard/blog/new"><Plus /> Create article</Link></Button></div> : <div className="divide-y">{posts.map((post) => <article key={post.id} className="grid gap-4 px-4 py-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-muted sm:block"><Image src={post.coverImage} alt="" fill className="object-cover" sizes="96px" /></div>
        <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>{post.status}</Badge>{post.featured && <Badge variant="outline">Featured</Badge>}<span className="text-xs text-muted-foreground">{post.category}</span></div><Link className="font-medium hover:underline" href={`/dashboard/blog/${post.id}/edit`}>{post.title}</Link><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{post.excerpt}</p><p className="mt-2 text-xs text-muted-foreground">Updated {post.updatedAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div>
        <div className="flex items-center justify-end gap-1"><Button variant="outline" size="sm" asChild><Link href={`/dashboard/blog/${post.id}/edit`}>Edit</Link></Button><DeleteBlogPostButton id={post.id} title={post.title} /></div>
      </article>)}</div>}
    </CardContent></Card>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <Card><CardContent><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>; }
