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
  rawMaterialsParsers,
  RawMaterialsQP,
} from "@/lib/searchParams/dashboard/raw-materials/rawMaterialsSearchParams";
import RawMaterialsToolbar from "./RawMaterialsToolbar";
import RawMaterialActions from "./RawMaterialAction";

type Item = {
  id: string;
  companyItemName: string;
  supplierItemName: string | null;
  itemCode: string | null;
  hsnCode: string | null;
  unit: string;
  reorderLevel: number | null;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: Date | null;
  createdAt: Date;
  preferredSupplier: {
    companyName: string;
  } | null;
  stockOnHand: number;
  lastPurchasePrice: number | null;
  lastPurchaseAt: Date | null;
  lastPurchaseSupplier: string | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

function formatCurrency(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function RawMaterialsTable({
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
  qp: RawMaterialsQP;
}) {
  const [, setState] = useQueryStates(rawMaterialsParsers, {
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
      <RawMaterialsToolbar qp={qp} />

      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Our Item Name</TableHead>
              <TableHead className="text-white">Supplier Item Name</TableHead>
              <TableHead className="text-white">Code / HSN / Unit</TableHead>
              <TableHead className="text-white">Preferred Supplier</TableHead>
              <TableHead className="text-white">Stock</TableHead>
              <TableHead className="text-white">Last GRN Price</TableHead>
              <TableHead className="text-white">Last Purchase</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Deleted</TableHead>
              <TableHead className="text-white w-[120px] text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No raw materials found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      className="hover:underline"
                      href={`/dashboard/raw-materials/${item.id}`}>
                      {item.companyItemName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </TableCell>
                  <TableCell>{item.supplierItemName || "-"}</TableCell>
                  <TableCell>
                    <div>{item.itemCode || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[item.hsnCode, item.unit].filter(Boolean).join(" • ") || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{item.preferredSupplier?.companyName || "-"}</TableCell>
                  <TableCell>
                    <div>
                      {formatNumber(item.stockOnHand)} {item.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reorder: {item.reorderLevel ?? "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{formatCurrency(item.lastPurchasePrice)}</div>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(item.lastPurchaseAt)}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.lastPurchaseSupplier || "-"}
                    </div>
                  </TableCell>
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
                    <RawMaterialActions id={item.id} deletedAt={item.deletedAt} />
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
