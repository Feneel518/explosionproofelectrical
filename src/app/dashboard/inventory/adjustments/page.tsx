import Link from "next/link";

import StockAdjustmentToolbar from "@/components/dashboard/inventory/stock-adjustment/StockAdjustmentToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import {
  StockAdjustmentQP,
  stockAdjustmentSearchParamsCache,
} from "@/lib/searchParams/dashboard/inventory/stock-adjustment/StockAdjustmentSearchParams";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(value);
}

function buildAdjustmentOrderBy(sp: StockAdjustmentQP) {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "adjustNo":
      return [{ adjustFy: dir }, { adjustNo: dir }] as any;
    case "adjustedByNameSnapshot":
      return [{ adjustedByNameSnapshot: dir }, { adjustDate: "desc" }] as any;
    case "status":
      return [{ status: dir }, { adjustDate: "desc" }] as any;
    case "createdAt":
      return [{ createdAt: dir }] as any;
    case "adjustDate":
    default:
      return [{ adjustDate: dir }, { createdAt: "desc" }] as any;
  }
}

function buildPageHref(sp: StockAdjustmentQP, page: number) {
  const params = new URLSearchParams();

  if (sp.q) params.set("q", sp.q);
  params.set("status", sp.status);
  params.set("year", String(sp.year));
  params.set("fy", sp.fy);
  params.set("sort", sp.sort);
  params.set("dir", sp.dir);
  if (sp.pageSize !== 20) params.set("pageSize", String(sp.pageSize));
  params.set("page", String(page));

  return `/dashboard/inventory/adjustments?${params.toString()}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = stockAdjustmentSearchParamsCache.parse(await searchParams);

  const q = sp.q.trim();
  const status = sp.status;
  const fy = sp.fy;
  const page = Math.max(1, sp.page);
  const pageSize = Math.min(100, Math.max(10, sp.pageSize));

  const where: any = {};

  if (status !== "ALL") where.status = status;
  if (fy) where.adjustFy = fy;

  if (q) {
    where.OR = [
      { adjustedByNameSnapshot: { contains: q, mode: "insensitive" } },
      { reason: { contains: q, mode: "insensitive" } },
      { remarks: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      orderBy: buildAdjustmentOrderBy(sp),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        adjustNo: true,
        adjustFy: true,
        status: true,
        adjustDate: true,
        adjustedByNameSnapshot: true,
        reason: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            movementType: true,
            qty: true,
          },
        },
      },
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock Adjustments</h1>
        <p className="text-sm text-muted-foreground">
          Post manual stock corrections with full ledger trace.
        </p>
      </div>

      <StockAdjustmentToolbar qp={sp} />

      <div className="rounded-xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Adjustment No</TableHead>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Adjusted By</TableHead>
              <TableHead className="text-white">Reason</TableHead>
              <TableHead className="text-white">Items</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="w-[180px] text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No stock adjustment found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => {
                const totalIn = row.items.reduce((sum, item) => {
                  if (["ADJUST_IN", "RETURN_IN", "IN"].includes(item.movementType)) {
                    return sum + Number(item.qty || 0);
                  }
                  return sum;
                }, 0);

                const totalOut = row.items.reduce((sum, item) => {
                  if (
                    ["ADJUST_OUT", "SCRAP_OUT", "RETURN_OUT", "OUT"].includes(
                      item.movementType,
                    )
                  ) {
                    return sum + Number(item.qty || 0);
                  }
                  return sum;
                }, 0);

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/inventory/adjustments/${row.id}`}
                        className="font-medium hover:underline">
                        {formatFinancialDocumentNumber(row.adjustFy, row.adjustNo)}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Created {formatDate(row.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(row.adjustDate)}</TableCell>
                    <TableCell>{row.adjustedByNameSnapshot || "-"}</TableCell>
                    <TableCell>{row.reason || "-"}</TableCell>
                    <TableCell>
                      <div>{row.items.length}</div>
                      <div className="text-xs text-muted-foreground">
                        In {totalIn} / Out {totalOut}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "FINALIZED" ? "default" : "secondary"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/inventory/adjustments/${row.id}`}>View</Link>
                        </Button>
                        {row.status === "DRAFT" ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/inventory/adjustments/${row.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1} asChild>
            <Link href={buildPageHref(sp, page - 1)}>Prev</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} asChild>
            <Link href={buildPageHref(sp, page + 1)}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
