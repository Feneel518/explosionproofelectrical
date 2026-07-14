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
  softDeleteWorkerAction,
  restoreWorkerAction,
} from "@/lib/actions/dashboard/contractors/workers/SoftDeleteWorker";
import { toast } from "sonner";

export default function WorkerActions({
  id,
  deletedAt,
}: {
  id: string;
  deletedAt: Date | null;
}) {
  const [pending, start] = React.useTransition();

  const onSoftDelete = () => {
    start(async () => {
      const res = await softDeleteWorkerAction(id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
    });
  };

  const onRestore = () => {
    start(async () => {
      const res = await restoreWorkerAction(id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
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
          <Link href={`/dashboard/contractors/workers/${id}/edit`}>Edit</Link>
        </DropdownMenuItem>

        {!deletedAt ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onSoftDelete}>
            Soft delete
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onRestore}>Restore</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
