"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";

// import CustomerActions from "./customer-actions";

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
  ProductsParsers,
  ProductsQP,
} from "@/lib/searchParams/dashboard/products/productsSearchParams";
import { ProductStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

import ProductsToolbar from "./ProductsToolbar";
import ProductAction from "./ProductAction";

type Item = {
  id: string;
  name: string;
  hsnCode: string | null;
  category: {
    name: string;
    id: string;
  };

  variants: {
    id: string;
  }[];

  status: ProductStatus;
  deletedAt: Date | null;
  createdAt: Date;
};

export default function ProductsTable({
  items,
  total,
  page,
  pageSize,
  qp,

  categories,
}: {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  qp: ProductsQP;
  categories: {
    id: string;
    name: string;
  }[];
}) {
  const [, setState] = useQueryStates(ProductsParsers, {
    shallow: false,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  // local input state
  const [pageInput, setPageInput] = React.useState<string>(String(page));

  React.useEffect(() => {
    // keep in sync when arrows/filter changes page
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
      <ProductsToolbar qp={qp} categories={categories} />

      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
 
              <TableHead>Category</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="">
                      <Link
                        className="hover:underline"
                        href={`/dashboard/products/${c.id}`}>
                        {c.name}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.hsnCode ?? "-"}
                    </div>
                  </TableCell>
                  <TableCell>{c.category.name ?? "-"}</TableCell>
                  <TableCell>{c.variants.length}</TableCell>

                  <TableCell>
                    {c.status === "ACTIVE" ? (
                      <Badge>ACTIVE</Badge>
                    ) : (
                      <Badge variant="secondary">INACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.deletedAt ? (
                      <Badge variant="destructive">YES</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductAction id={c.id} deletedAt={c.deletedAt} />
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
                  // allow empty while typing; strip non-digits
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
