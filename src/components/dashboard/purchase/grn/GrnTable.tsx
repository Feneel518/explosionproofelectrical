"use client";

import React from "react";
import Link from "next/link";
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
  grnParsers,
  GrnQP,
} from "@/lib/searchParams/dashboard/purchase/grn/GrnSearchParams";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import GrnToolbar from "./GrnToolbar";
import GrnAction from "./GrnAction";
import {
  GrnDiscrepancyAction,
  GrnMaterialCheckStatus,
  GrnQuantityCheckStatus,
  GrnStatus,
} from "@prisma/client";

type GrnListItem = {
  id: string;
  grnNo: number;
  grnFy: string;
  status: GrnStatus;
  materialCheckStatus: GrnMaterialCheckStatus;
  quantityCheckStatus: GrnQuantityCheckStatus;
  discrepancyAction: GrnDiscrepancyAction | null;
  supplierNameSnapshot: string | null;
  supplierInvoiceNo: string | null;
  supplierInvoiceDate: Date | null;
  receivedAt: Date;
  createdAt: Date;
  items: { id: string }[];
};

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusVariant(status: GrnStatus) {
  switch (status) {
    case "FINALIZED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function postCheckVariant(
  materialCheckStatus: GrnMaterialCheckStatus,
  quantityCheckStatus: GrnQuantityCheckStatus,
) {
  if (
    materialCheckStatus === "CHECKED_NOT_OK" ||
    quantityCheckStatus === "MISMATCH"
  ) {
    return "destructive";
  }

  if (materialCheckStatus === "CHECKED_OK" && quantityCheckStatus === "OK") {
    return "default";
  }

  return "secondary";
}

function materialLabel(status: GrnMaterialCheckStatus) {
  switch (status) {
    case "CHECKED_OK":
      return "Material OK";
    case "CHECKED_NOT_OK":
      return "Material Not OK";
    default:
      return "Material Pending";
  }
}

function quantityLabel(status: GrnQuantityCheckStatus) {
  switch (status) {
    case "OK":
      return "Quantity OK";
    case "MISMATCH":
      return "Quantity Mismatch";
    default:
      return "Quantity Pending";
  }
}

function actionLabel(action: GrnDiscrepancyAction | null) {
  if (!action) return null;
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function GrnTable({
  items,
  total,
  page,
  pageSize,
  qp,
}: {
  items: GrnListItem[];
  total: number;
  page: number;
  pageSize: number;
  qp: GrnQP;
}) {
  const [, setState] = useQueryStates(grnParsers, { shallow: false });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  const [pageInput, setPageInput] = React.useState(String(page));
  React.useEffect(() => setPageInput(String(page)), [page]);

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
      <GrnToolbar qp={qp} />

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No GRN found.
          </div>
        ) : (
          items.map((grn) => (
            <div key={grn.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/purchase/grn/${grn.id}`}
                    className="block truncate text-base font-medium hover:underline">
                    {formatFinancialDocumentNumber(grn.grnFy, grn.grnNo)}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {grn.supplierNameSnapshot || "Unnamed Supplier"}
                  </div>
                </div>
                <Badge variant={statusVariant(grn.status) as any}>
                  {grn.status}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant={
                    postCheckVariant(grn.materialCheckStatus, grn.quantityCheckStatus) as any
                  }>
                  {materialLabel(grn.materialCheckStatus)}
                </Badge>
                <Badge
                  variant={
                    postCheckVariant(grn.materialCheckStatus, grn.quantityCheckStatus) as any
                  }>
                  {quantityLabel(grn.quantityCheckStatus)}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Received</div>
                  <div>{formatDate(grn.receivedAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div>{grn.items.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vendor Bill</div>
                  <div>{grn.supplierInvoiceNo || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Bill Date</div>
                  <div>{formatDate(grn.supplierInvoiceDate)}</div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <GrnAction id={grn.id} status={grn.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-xl border bg-card p-2 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">GRN</TableHead>
              <TableHead className="text-white">Supplier</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Post Check</TableHead>
              <TableHead className="text-white">Received</TableHead>
              <TableHead className="text-white">Supplier Bill</TableHead>
              <TableHead className="text-white">Items</TableHead>
              <TableHead className="w-[120px] text-right text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No GRN found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/purchase/grn/${grn.id}`}
                      className="font-medium hover:underline">
                      {formatFinancialDocumentNumber(grn.grnFy, grn.grnNo)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(grn.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>{grn.supplierNameSnapshot || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(grn.status) as any}>
                      {grn.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        className="w-fit"
                        variant={
                          postCheckVariant(
                            grn.materialCheckStatus,
                            grn.quantityCheckStatus,
                          ) as any
                        }>
                        {materialLabel(grn.materialCheckStatus)}
                      </Badge>
                      <Badge
                        className="w-fit"
                        variant={
                          postCheckVariant(
                            grn.materialCheckStatus,
                            grn.quantityCheckStatus,
                          ) as any
                        }>
                        {quantityLabel(grn.quantityCheckStatus)}
                      </Badge>
                      {grn.discrepancyAction ? (
                        <div className="text-xs text-muted-foreground">
                          Action: {actionLabel(grn.discrepancyAction)}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(grn.receivedAt)}</TableCell>
                  <TableCell>
                    <div>{grn.supplierInvoiceNo || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(grn.supplierInvoiceDate)}
                    </div>
                  </TableCell>
                  <TableCell>{grn.items.length}</TableCell>
                  <TableCell className="text-right">
                    <GrnAction id={grn.id} status={grn.status} />
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
                className="border-none bg-transparent p-0 pl-2"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onChange={(event) =>
                  setPageInput(event.target.value.replace(/[^\d]/g, ""))
                }
                onBlur={() => commitPage(pageInput)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitPage(pageInput);
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setPageInput(String(page));
                  }
                }}
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
