"use client";

import Link from "next/link";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { softDeleteCastingMasterAction } from "@/lib/actions/dashboard/casting-masters/softDeleteCastingMaster";
import { restoreCastingMasterAction } from "@/lib/actions/dashboard/casting-masters/restoreCastingMaster";

export default function CastingMasterActions({
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
          <Link href={`/dashboard/casting-masters/${id}/edit`}>Edit</Link>
        </DropdownMenuItem>

        {!deletedAt ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() =>
              start(async () => void (await softDeleteCastingMasterAction(id)))
            }
          >
            Soft delete
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              start(async () => void (await restoreCastingMasterAction(id)))
            }
          >
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
