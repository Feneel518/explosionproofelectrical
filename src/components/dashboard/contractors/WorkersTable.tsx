"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  workersParsers,
  WorkersQP,
} from "@/lib/searchParams/dashboard/contractors/workersSearchParams";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import WorkersToolbar from "./WorkersToolbar";
import WorkerActions from "./WorkerActions";

type Item = {
  id: string;
  code: string;
  name: string;
  role: "TURNER" | "ASSEMBLY" | "POLISHING" | "PAINTING" | "HELPER" | "OTHER";
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: Date | null;
  createdAt: Date;
};

export default function WorkersTable({
  items,
  total,
  page,
  pageSize,
  qp,
}: {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  qp: WorkersQP;
}) {
  const [, setState] = useQueryStates(workersParsers, {
    shallow: false,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  const [pageInput, setPageInput] = React.useState<string>(String(page));

  React.useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const commitPage = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setPageInput(String(page));
      return;
    }

    const next = clampPage(Math.trunc(n));
    setPageInput(String(next));

    if (next !== page) setState({ page: next });
  };

  return (
    <div className="space-y-4">
      <WorkersToolbar qp={qp} />

      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Code</TableHead>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Role</TableHead>
              <TableHead className="text-white">Phone</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Deleted</TableHead>
              <TableHead className="w-[120px] text-right text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="font-light">
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No workers found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.code}</TableCell>
                  <TableCell>
                    <Link
                      className="hover:underline"
                      href={`/dashboard/contractors/workers/${w.id}`}>
                      {w.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{w.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {w.phone ? (
                      w.phone
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {w.status === "ACTIVE" ? (
                      <Badge>ACTIVE</Badge>
                    ) : (
                      <Badge variant="secondary">INACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {w.deletedAt ? (
                      <Badge variant="destructive">YES</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <WorkerActions id={w.id} deletedAt={w.deletedAt} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!canPrev}
            onClick={() => setState({ page: page - 1 })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1">
            <span className="text-sm text-muted-foreground">Page</span>

            <div className="w-6">
              <Input
                className="bg-transparent  p-0 pl-2 border-none "
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setPageInput(v);
                }}
                onBlur={() => commitPage(pageInput)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitPage(pageInput);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setPageInput(String(page));
                  }
                }}
                aria-label="Go to page"
              />
            </div>

            <span className="text-sm text-muted-foreground">
              / {totalPages}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => commitPage(pageInput)}
              className="h-8">
              Go
            </Button>
          </div>
          <Button
            variant="outline"
            disabled={!canNext}
            onClick={() => setState({ page: page + 1 })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
