"use client";

import Link from "next/link";
import * as React from "react";
import { useQueryStates } from "nuqs";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  castingMastersParsers,
  CastingMastersQP,
} from "@/lib/searchParams/dashboard/casting-masters/castingMastersSearchParams";
import CastingMastersToolbar from "./CastingMastersToolbar";
import CastingMasterActions from "./CastingMasterAction";

type Item = {
  id: string;
  castingItemName: string;
  castingCode: string | null;
  drawingNumber: string | null;
  hsnCode: string | null;
  unit: string;
  standardWeightKg: number | null;
  reorderLevel: number | null;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: Date | null;
  createdAt: Date;
};

function formatWeight(value?: number | null) {
  if (value == null) return "-";
  return `${Number(value).toFixed(3)} kg`;
}

export default function CastingMastersTable({
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
  qp: CastingMastersQP;
}) {
  const [, setState] = useQueryStates(castingMastersParsers, {
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
      <CastingMastersToolbar qp={qp} />

      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Casting Name</TableHead>
              <TableHead className="text-white">Code / Drawing / HSN</TableHead>
              <TableHead className="text-white">Unit / Std Weight</TableHead>
              <TableHead className="text-white">Reorder</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Deleted</TableHead>
              <TableHead className="w-[120px] text-right text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No castings found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      className="hover:underline"
                      href={`/dashboard/casting-masters/${item.id}`}
                    >
                      {item.castingItemName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{item.castingCode || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[item.drawingNumber, item.hsnCode].filter(Boolean).join(" • ") || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{item.unit || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatWeight(item.standardWeightKg)}
                    </div>
                  </TableCell>
                  <TableCell>{item.reorderLevel ?? "-"}</TableCell>
                  <TableCell>
                    {item.status === "ACTIVE" ? (
                      <Badge>ACTIVE</Badge>
                    ) : (
                      <Badge variant="secondary">INACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.deletedAt ? (
                      <Badge variant="destructive">YES</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CastingMasterActions id={item.id} deletedAt={item.deletedAt} />
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
            onClick={() => setState({ page: page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1">
            <span className="text-sm text-muted-foreground">Page</span>

            <div className="w-10">
              <Input
                className="border-none bg-transparent p-0 pl-2"
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

            <span className="text-sm text-muted-foreground">/ {totalPages}</span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => commitPage(pageInput)}
              className="h-8"
            >
              Go
            </Button>
          </div>
          <Button
            variant="outline"
            disabled={!canNext}
            onClick={() => setState({ page: page + 1 })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
