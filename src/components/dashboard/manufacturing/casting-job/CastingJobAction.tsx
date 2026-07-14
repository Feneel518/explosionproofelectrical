"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { CastingJobStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CastingJobAction({
  id,
  status,
}: {
  id: string;
  status: CastingJobStatus;
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
          <Link href={`/dashboard/manufacturing/casting-jobs/${id}`}>View</Link>
        </DropdownMenuItem>
        {status === "DRAFT" ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/manufacturing/casting-jobs/${id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
