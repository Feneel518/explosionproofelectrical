"use client";

import {
  orderParsers,
  OrderQP,
} from "@/lib/searchParams/dashboard/sales/order/OrderSearchParams";
import { useQueryStates } from "nuqs";
import React, { FC } from "react";
import OrderToolbar from "./OrderToolbar";
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
import OrderAction from "./OrderAction";
import { SalesOrderStatus } from "@prisma/client";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

interface OrderTableProps {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  qp: OrderQP;
}

type Item = {
  id: string;
  orderNo: number;
  orderFy: string;
  status: string;
  sourceType: string;

  clientName: string | null;
  clientNameSnapshot: string | null;

  poNumber: string | null;
  poDate: Date | null;
  orderDate: Date | null;

  customerId: string | null;
  customer: { id: string; companyName: string } | null;

  quotationId: string | null;
  quotation: { id: string; quoteNo: number; quoteFy: string } | null;

  grandTotal: any;
  totalItemsCount: number;
  totalOrderedQty: number;
  totalDispatchedQty: number;
  totalInvoicedQty: number;
  totalPendingQty: number;

  isFullyDispatched: boolean;
  isFullyInvoiced: boolean;

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
    case "COMPLETED":
    case "INVOICED":
    case "DISPATCHED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "IN_PRODUCTION":
    case "PARTIALLY_DISPATCHED":
    case "PARTIALLY_INVOICED":
      return "outline";
    case "CONFIRMED":
      return "secondary";
    case "DRAFT":
    default:
      return "secondary";
  }
}

const OrderTable: FC<OrderTableProps> = ({
  items,
  total,
  page,
  pageSize,
  qp,
}) => {
  const [, setState] = useQueryStates(orderParsers, {
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
      <OrderToolbar qp={qp} />

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No orders found.
          </div>
        ) : (
          items.map((o) => {
            const title =
              o.customer?.companyName ||
              o.clientNameSnapshot ||
              o.clientName ||
              "Unnamed Client";

            return (
              <div key={o.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/sales/orders/${o.id}`}
                      className="block truncate text-base font-medium hover:underline">
                      {title}
                    </Link>

                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatFinancialDocumentNumber(o.orderFy, o.orderNo)}
                      </span>
                      {" • "}
                      <span>{o.sourceType}</span>
                      {" • "}
                      <span>{formatDate(o.orderDate || o.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={statusBadgeVariant(o.status) as any}>
                      {o.status}
                    </Badge>
                    {o.deletedAt ? (
                      <Badge variant="destructive">TRASH</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      PO Number
                    </div>
                    <div className="truncate">{o.poNumber || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Quotation
                    </div>
                    <div>
                      {o.quotation
                        ? formatFinancialDocumentNumber(
                            o.quotation.quoteFy,
                            o.quotation.quoteNo,
                          )
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Value</div>
                    <div>{formatCurrency(o.grandTotal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Pending Qty
                    </div>
                    <div>{o.totalPendingQty}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <OrderAction
                    id={o.id}
                    deletedAt={o.deletedAt}
                    status={o.status as SalesOrderStatus}
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
              <TableHead className="text-white">Order</TableHead>
              <TableHead className="text-white">Client</TableHead>
              <TableHead className="text-white">Source</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">PO / Quote</TableHead>
              <TableHead className="text-white">Value</TableHead>
              <TableHead className="text-white">Progress</TableHead>
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
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((o) => {
                const title =
                  o.customer?.companyName ||
                  o.clientNameSnapshot ||
                  o.clientName ||
                  "Unnamed Client";

                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        className="font-medium hover:underline"
                        href={`/dashboard/sales/orders/${o.id}`}>
                        {formatFinancialDocumentNumber(o.orderFy, o.orderNo)}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(o.orderDate || o.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">
                        PO: {o.poNumber || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{o.sourceType}</Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusBadgeVariant(o.status) as any}>
                        {o.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {o.quotation ? (
                        <Link
                          href={`/dashboard/sales/quotations/${o.quotation.id}`}
                          className="text-sm hover:underline">
                          {formatFinancialDocumentNumber(
                            o.quotation.quoteFy,
                            o.quotation.quoteNo,
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>{formatCurrency(o.grandTotal)}</TableCell>

                    <TableCell>
                      <div className="text-sm">
                        Ordered:{" "}
                        <span className="font-medium">{o.totalOrderedQty}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Dispatched: {o.totalDispatchedQty} • Invoiced:{" "}
                        {o.totalInvoicedQty}
                      </div>
                    </TableCell>

                    <TableCell>
                      {o.deletedAt ? (
                        <Badge variant="destructive">YES</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <OrderAction
                        id={o.id}
                        deletedAt={o.deletedAt}
                        status={o.status as SalesOrderStatus}
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

export default OrderTable;
