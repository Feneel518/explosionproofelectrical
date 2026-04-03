"use client";

import {
  invoiceParsers,
  InvoiceQP,
} from "@/lib/searchParams/dashboard/sales/invoice/InvoiceSearchParams";
import { useQueryStates } from "nuqs";
import React, { FC } from "react";
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

import InvoiceAction from "./InvoiceAction";
import { InvoiceStatus } from "@prisma/client";
import InvoiceToolbar from "./InvoiceToolbar";
import { InvoiceListItem } from "@/lib/types/Invoicetable";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { getPaymentReminderState } from "@/lib/helpers/globalHelpers/invoicePaymentReminder";
import type { ClientSafe } from "@/lib/helpers/server/serializeForClient";

interface InvoiceTableProps {
  items: ClientSafe<InvoiceListItem>[];
  total: number;
  page: number;
  pageSize: number;
  qp: InvoiceQP;
}

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

function formatCurrency(v: any) {
  const num = Number(v ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function statusBadgeVariant(status: string) {
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

function paymentBadgeVariant({
  isPaid,
  isOverdue,
  isDueToday,
}: {
  isPaid: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
}) {
  if (isPaid) return "default";
  if (isOverdue) return "destructive";
  if (isDueToday) return "outline";
  return "secondary";
}

const InvoiceTable: FC<InvoiceTableProps> = ({
  items,
  total,
  page,
  pageSize,
  qp,
}) => {
  const [, setState] = useQueryStates(invoiceParsers, {
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

  console.log(items);

  return (
    <div className="space-y-4">
      <InvoiceToolbar qp={qp} />

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No invoices found.
          </div>
        ) : (
          items.map((inv) => {
            const title =
              inv.customer?.companyName ||
              inv.clientNameSnapshot ||
              "Unnamed Client";
            const paymentState = getPaymentReminderState({
              paymentTerms: inv.salesOrder?.paymentTerms ?? null,
              invoiceDate: inv.invoiceDate,
              dispatchDate: inv.dispatchDate,
              paymentReceived: inv.paymentReceived,
            });

            return (
              <div key={inv.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/sales/invoices/${inv.id}`}
                      className="block truncate text-base font-medium hover:underline">
                      {title}
                    </Link>

                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatFinancialDocumentNumber(
                          inv.invoiceFy,
                          inv.invoiceNo,
                        )}
                      </span>
                      {" • "}
                      <span>
                        {formatDate(inv.invoiceDate || inv.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      PO Number
                    </div>
                    <div className="truncate">{inv.poNumber || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Order</div>
                    <div>
                      {inv.salesOrder
                        ? formatFinancialDocumentNumber(
                            inv.salesOrder.orderFy,
                            inv.salesOrder.orderNo,
                          )
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Value</div>
                    <div>{formatCurrency(inv.grandTotal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div>{inv.emailedAt ? "Sent" : "Not sent"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Payment</div>
                    <div>{paymentState.statusText}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <InvoiceAction
                    id={inv.id}
                    status={inv.status as InvoiceStatus}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden rounded-xl border bg-card p-2 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Invoice</TableHead>
              <TableHead className="text-white">Client</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Order</TableHead>
              <TableHead className="text-white">PO</TableHead>
              <TableHead className="text-white">Value</TableHead>
              <TableHead className="text-white">Payment</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="w-[120px] text-right text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((inv) => {
                const title =
                  inv.customer?.companyName ||
                  inv.clientNameSnapshot ||
                  "Unnamed Client";
                const paymentState = getPaymentReminderState({
                  paymentTerms: inv.salesOrder?.paymentTerms ?? null,
                  invoiceDate: inv.invoiceDate,
                  dispatchDate: inv.dispatchDate,
                  paymentReceived: inv.paymentReceived,
                });

                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        className="font-medium hover:underline"
                        href={`/dashboard/sales/invoices/${inv.id}`}>
                        {formatFinancialDocumentNumber(
                          inv.invoiceFy,
                          inv.invoiceNo,
                        )}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(inv.invoiceDate || inv.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">
                        GSTIN: {inv.gstinSnapshot || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusBadgeVariant(inv.status) as any}>
                        {inv.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {inv.salesOrder ? (
                        <Link
                          href={`/dashboard/sales/orders/${inv.salesOrder.id}`}
                          className="text-sm hover:underline">
                          {formatFinancialDocumentNumber(
                            inv.salesOrder.orderFy,
                            inv.salesOrder.orderNo,
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">{inv.poNumber || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(inv.poDate)}
                      </div>
                    </TableCell>

                    <TableCell>{formatCurrency(inv.grandTotal)}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          paymentBadgeVariant({
                            isPaid: paymentState.isPaid,
                            isOverdue: paymentState.isOverdue,
                            isDueToday: paymentState.isDueToday,
                          }) as any
                        }>
                        {paymentState.statusText}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {inv.emailedAt ? (
                        <Badge variant="outline">SENT</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not sent
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <InvoiceAction
                        id={inv.id}
                        status={inv.status as InvoiceStatus}
                      />
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

export default InvoiceTable;
