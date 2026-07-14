"use client";

import {
  quotationParsers,
  QuotationQP,
} from "@/lib/searchParams/dashboard/sales/quotation/QuotationSearchParams";
import { useQueryStates } from "nuqs";
import React, { FC } from "react";
import QuotationToolbar from "./QuotationToolbar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuotationAction from "./QuotationAction";
import { QuotationStatus } from "@prisma/client";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

interface QuotationTableProps {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  qp: QuotationQP;
  categories: { id: string; name: string }[];
}

type Item = {
  id: string;
  quoteNo: number;
  quoteFy: string;

  status: string;
  platform: string;

  clientName: string | null;

  receivedFromName: string | null;
  receivedFromPhone: string | null;
  receivedFromEmail: string | null;

  customerId: string | null;
  customer: { id: string; companyName: string } | null;

  nextFollowupAt: Date | null;
  lastFollowupAt: Date | null;

  convertedToOrderAt: Date | null;

  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(d: Date | null) {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return "-";
  }
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "EXPIRED":
      return "secondary";
    case "SENT":
      return "outline";
    case "CONVERTED":
      return "default";
    case "DRAFT":
    default:
      return "secondary";
  }
}

const QuotationTable: FC<QuotationTableProps> = ({
  items,
  total,
  page,
  pageSize,
  qp,
  categories,
}) => {
  const [, setState] = useQueryStates(quotationParsers, {
    shallow: false,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  // local input state
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
      <QuotationToolbar qp={qp} categories={categories} />

      {/* ✅ MOBILE CARDS */}
      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No quotations found.
          </div>
        ) : (
          items.map((q) => {
            const title =
              q.customer?.companyName ||
              q.clientName ||
              q.receivedFromName ||
              "Unnamed Lead";

            return (
              <div key={q.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/sales/quotations/${q.id}`}
                      className="block truncate text-base font-medium hover:underline">
                      {title}
                    </Link>

                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatFinancialDocumentNumber(q.quoteFy, q.quoteNo)}
                      </span>
                      {" • "}
                      <span>{q.platform}</span>
                      {" • "}
                      <span>{formatDate(q.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={statusBadgeVariant(q.status) as any}>
                      {q.status}
                    </Badge>
                    {q.deletedAt ? (
                      <Badge variant="destructive">TRASH</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="truncate">{q.receivedFromPhone || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="truncate">{q.receivedFromEmail || "-"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Next Follow-up
                    </div>
                    <div>{formatDate(q.nextFollowupAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Converted
                    </div>
                    <div>{q.convertedToOrderAt ? "Yes" : "No"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Platform
                    </div>
                    <div>{q.platform}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <QuotationAction
                    status={q.status as QuotationStatus}
                    id={q.id}
                    deletedAt={q.deletedAt}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ✅ DESKTOP TABLE */}
      <div className="hidden rounded-xl border bg-card p-2 md:block">
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="text-white!">Quotation</TableHead>
              <TableHead className="text-white!">Client</TableHead>
              <TableHead className="text-white!">Platform</TableHead>
              <TableHead className="text-white!">Status</TableHead>
              <TableHead className="text-white!">Follow-up</TableHead>
              <TableHead className="text-white!">Deleted</TableHead>
              <TableHead className="w-[120px] text-right text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="font-light">
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No quotations found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((q) => {
                const title =
                  q.customer?.companyName ||
                  q.clientName ||
                  q.receivedFromName ||
                  "Unnamed Lead";

                return (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link
                        className="font-medium hover:underline"
                        href={`/dashboard/sales/quotations/${q.id}`}>
                        {formatFinancialDocumentNumber(q.quoteFy, q.quoteNo)}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(q.createdAt)} • {q.platform}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">
                        {q.receivedFromPhone || "-"} •{" "}
                        {q.receivedFromEmail || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusBadgeVariant(q.platform) as any}>
                        {q.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(q.status) as any}>
                        {q.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        Next:{" "}
                        <span className="font-medium">
                          {formatDate(q.nextFollowupAt)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {formatDate(q.lastFollowupAt)}
                      </div>
                    </TableCell>

                    <TableCell>
                      {q.deletedAt ? (
                        <Badge variant="destructive">YES</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <QuotationAction
                        status={q.status as QuotationStatus}
                        id={q.id}
                        deletedAt={q.deletedAt}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (same as your categories page) */}
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
};

export default QuotationTable;
