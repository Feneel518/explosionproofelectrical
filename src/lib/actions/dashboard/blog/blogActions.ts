"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/check/requireAuth";
import { sanitizeBlogContent } from "@/lib/editor/sanitizeBlogContent";
import { prisma } from "@/lib/prisma/db";
import { BlogPostInput, BlogPostSchema } from "@/lib/validators/dashboard/blog/BlogPostValidator";

export type BlogActionResult = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };

function cleanOptional(value?: string) {
  const clean = value?.trim();
  return clean || null;
}

function databaseMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "That URL slug is already used by another article.";
  }
  return error instanceof Error ? error.message : "Unable to save the article.";
}

export async function saveBlogPostAction(id: string | null, input: BlogPostInput): Promise<BlogActionResult> {
  await requireAuth();
  const parsed = BlogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted article details.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const values = { ...parsed.data, content: sanitizeBlogContent(parsed.data.content) };
  const publishedAt = values.status === "PUBLISHED" ? new Date() : null;
  try {
    if (id) {
      const current = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
      if (!current) return { ok: false, message: "Article not found." };
      await prisma.blogPost.update({
        where: { id },
        data: { ...values, seoTitle: cleanOptional(values.seoTitle), seoDescription: cleanOptional(values.seoDescription), publishedAt: values.status === "PUBLISHED" ? current.publishedAt ?? publishedAt : null },
      });
    } else {
      await prisma.blogPost.create({
        data: { ...values, seoTitle: cleanOptional(values.seoTitle), seoDescription: cleanOptional(values.seoDescription), publishedAt },
      });
    }
  } catch (error) {
    return { ok: false, message: databaseMessage(error) };
  }

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${values.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/dashboard/blog");
  return { ok: true, message: values.status === "PUBLISHED" ? "Article published successfully." : "Draft saved successfully." };
}

export async function deleteBlogPostAction(id: string) {
  await requireAuth();
  const post = await prisma.blogPost.delete({ where: { id }, select: { slug: true } });
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/dashboard/blog");
  redirect("/dashboard/blog");
}
