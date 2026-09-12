import { notFound } from "next/navigation";
import { BlogPostEditor } from "@/components/dashboard/blog/BlogPostEditor";
import { prisma } from "@/lib/prisma/db";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return <BlogPostEditor post={{ id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, category: post.category, coverImage: post.coverImage, coverImageAlt: post.coverImageAlt, authorName: post.authorName, status: post.status, featured: post.featured, seoTitle: post.seoTitle ?? "", seoDescription: post.seoDescription ?? "", keywords: post.keywords }} />;
}
