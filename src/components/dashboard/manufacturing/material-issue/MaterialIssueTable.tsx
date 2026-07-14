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
  materialIssueParsers,
  MaterialIssueQP,
} from "@/lib/searchParams/dashboard/manufacturing/material-issue/MaterialIssueSearchParams";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import MaterialIssueToolbar from "./MaterialIssueToolbar";
import MaterialIssueAction from "./MaterialIssueAction";
import { MaterialIssueStatus, MaterialIssueType } from "@prisma/client";

type MaterialIssueListItem = {
  id: string;
  issueNo: number;
  issueFy: string;
  status: MaterialIssueStatus;
  issueType: MaterialIssueType;
  issueDate: Date;
  issuedToNameSnapshot: string;
  issuedByNameSnapshot: string | null;
  directSaleReferenceNo: string | null;
  department: string | null;
  purpose: string | null;
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

function statusVariant(status: MaterialIssueStatus) {
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

function issueTypeVariant(type: MaterialIssueType) {
  return type === "DIRECT_SALE" ? "default" : "outline";
}

function issueTypeLabel(type: MaterialIssueType) {
  return type === "DIRECT_SALE" ? "Direct Sale" : "Internal Use";
}

export default function MaterialIssueTable({
  items,
  total,
  page,
  pageSize,
  qp,
}: {
  items: MaterialIssueListItem[];
  total: number;
  page: number;
  pageSize: number;
  qp: MaterialIssueQP;
}) {
  const [, setState] = useQueryStates(materialIssueParsers, { shallow: false });

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
      <MaterialIssueToolbar qp={qp} />

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No material issue found.
          </div>
        ) : (
          items.map((issue) => (
            <div key={issue.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/manufacturing/material-issues/${issue.id}`}
                    className="block truncate text-base font-medium hover:underline">
                    {formatFinancialDocumentNumber(issue.issueFy, issue.issueNo)}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {issue.issuedToNameSnapshot}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={statusVariant(issue.status) as any}>
                    {issue.status}
                  </Badge>
                  <Badge variant={issueTypeVariant(issue.issueType) as any}>
                    {issueTypeLabel(issue.issueType)}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Issue Date</div>
                  <div>{formatDate(issue.issueDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div>{issue.items.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {issue.issueType === "DIRECT_SALE" ? "Reference" : "Department"}
                  </div>
                  <div>
                    {issue.issueType === "DIRECT_SALE"
                      ? issue.directSaleReferenceNo || "-"
                      : issue.department || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {issue.issueType === "DIRECT_SALE" ? "Mode" : "Purpose"}
                  </div>
                  <div>
                    {issue.issueType === "DIRECT_SALE" ? "Direct Sale" : issue.purpose || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <MaterialIssueAction id={issue.id} status={issue.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-xl border bg-card p-2 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Issue No</TableHead>
              <TableHead className="text-white">Issued To</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Issue Date</TableHead>
              <TableHead className="text-white">Department/Purpose</TableHead>
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
                  No material issue found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/manufacturing/material-issues/${issue.id}`}
                      className="font-medium hover:underline">
                      {formatFinancialDocumentNumber(issue.issueFy, issue.issueNo)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(issue.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{issue.issuedToNameSnapshot}</div>
                    <div className="text-xs text-muted-foreground">
                      By: {issue.issuedByNameSnapshot || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(issue.status) as any}>
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={issueTypeVariant(issue.issueType) as any}>
                      {issueTypeLabel(issue.issueType)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(issue.issueDate)}</TableCell>
                  <TableCell>
                    <div>
                      {issue.issueType === "DIRECT_SALE"
                        ? issue.directSaleReferenceNo || "-"
                        : issue.department || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {issue.issueType === "DIRECT_SALE"
                        ? "Direct Sale"
                        : issue.purpose || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{issue.items.length}</TableCell>
                  <TableCell className="text-right">
                    <MaterialIssueAction id={issue.id} status={issue.status} />
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
