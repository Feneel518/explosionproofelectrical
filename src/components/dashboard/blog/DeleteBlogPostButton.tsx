"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBlogPostAction } from "@/lib/actions/dashboard/blog/blogActions";

export function DeleteBlogPostButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Delete ${title}`} onClick={() => { if (window.confirm(`Delete “${title}”? This cannot be undone.`)) startTransition(() => deleteBlogPostAction(id)); }}><Trash2 /></Button>;
}
