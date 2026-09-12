import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BlogPostSchema = z.object({
  title: z.string().trim().min(10).max(120),
  slug: z.string().trim().min(3).max(140).regex(slugPattern),
  excerpt: z.string().trim().min(30).max(320),
  content: z.string().trim().min(100),
  category: z.string().trim().min(2).max(50),
  coverImage: z.string().trim().url(),
  coverImageAlt: z.string().trim().min(5).max(180),
  authorName: z.string().trim().min(2).max(80),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.boolean(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  keywords: z.array(z.string().trim().min(1).max(60)).max(15),
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;
