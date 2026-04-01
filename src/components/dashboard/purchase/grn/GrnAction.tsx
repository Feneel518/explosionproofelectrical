"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GrnStatus } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function GrnAction({
  id,
  status,
}: {
  id: string;
  status: GrnStatus;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/purchase/grn/${id}`}>View</Link>
        </DropdownMenuItem>
        {status === "FINALIZED" ? (
          <DropdownMenuItem asChild>
            <Link href={`/grn/${id}/view`}>View Customer Copy</Link>
          </DropdownMenuItem>
        ) : null}
        {status === "DRAFT" ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/purchase/grn/${id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
