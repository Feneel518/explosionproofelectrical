import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import { BlogPostEditor } from "@/components/dashboard/blog/BlogPostEditor";

export default async function NewBlogPostPage() {
  await requirePermission("content.write"); return <BlogPostEditor />; }
