"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  restoreProductAction,
  softDeleteProductAction,
} from "@/lib/actions/dashboard/products/DeleteProduct";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";

export default function ProductAction({
  id,
  deletedAt,
}: {
  id: string;
  deletedAt: Date | null;
}) {
  const [pending, start] = React.useTransition();
  const router = useRouter();

  const runAction = (restore: boolean) => {
    if (!restore && !window.confirm("Remove this product from the catalogue? Linked historical records will be preserved.")) return;
    start(async () => {
      const result = restore
        ? await restoreProductAction(id)
        : await softDeleteProductAction(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/products/${id}/edit`}>Edit</Link>
        </DropdownMenuItem>

        {!deletedAt ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => runAction(false)}>
            Remove duplicate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => runAction(true)}>
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
