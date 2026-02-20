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
import { softDeleteCustomerAction } from "@/lib/actions/dashboard/customers/softDeleteCustomer";
import { restoreCustomerAction } from "@/lib/actions/dashboard/customers/restoreCustomer";
import { softDeleteCategoryAction } from "@/lib/actions/dashboard/categories/softCategoryDelete";
import { restoreCategoryyAction } from "@/lib/actions/dashboard/categories/restoreCategory";

export default function CategoriesActions({
  id,
  deletedAt,
}: {
  id: string;
  deletedAt: Date | null;
}) {
  const [pending, start] = React.useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/categories/${id}/edit`}>Edit</Link>
        </DropdownMenuItem>

        {!deletedAt ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() =>
              start(async () => void (await softDeleteCategoryAction(id)))
            }>
            Soft delete
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              start(async () => void (await restoreCategoryyAction(id)))
            }>
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
