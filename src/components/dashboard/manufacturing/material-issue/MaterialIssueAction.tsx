"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { MaterialIssueStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MaterialIssueAction({
  id,
  status,
}: {
  id: string;
  status: MaterialIssueStatus;
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
          <Link href={`/dashboard/manufacturing/material-issues/${id}`}>View</Link>
        </DropdownMenuItem>
        {status === "DRAFT" ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/manufacturing/material-issues/${id}/edit`}>
              Edit
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
