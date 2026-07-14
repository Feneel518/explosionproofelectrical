"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { Printer } from "lucide-react";
import { getSalesOrderStatusBadge } from "@/lib/helpers/dashboard/sales/orderStatusBadge";

type PendingOrderItem = {
  id: string;
  title: string;
  productLabel: string;
  productKey: string;
  pendingQty: number;
  orderedQty: number;
  dispatchedQty: number;
  invoicedQty: number;
};

type PendingOrder = {
  id: string;
  orderNo: number;
  orderFy: string;
  orderDate: string | null;
  deliveryDate: string | null;
  status: string;
  clientName: string;
  clientKey: string;
  totalPendingQty: number;
  items: PendingOrderItem[];
};

type Props = {
  generatedAt: string;
  orders: PendingOrder[];
};

const PRINT_ROWS_PER_PAGE = 18;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function chunkRows<T>(rows: T[], size: number) {
  if (size <= 0) return [rows];

  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

export default function PendingOrdersBoard({ generatedAt, orders }: Props) {
  const [clientFilter, setClientFilter] = React.useState<string>("ALL");
  const [productFilter, setProductFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");

  const clientOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of orders) {
      if (!row.clientKey) continue;
      if (!map.has(row.clientKey)) {
        map.set(row.clientKey, row.clientName || "Unknown Client");
      }
    }
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [orders]);

  const productOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of orders) {
      for (const item of row.items) {
        if (!item.productKey) continue;
        if (!map.has(item.productKey)) {
          map.set(item.productKey, item.productLabel || item.title || "Product");
        }
      }
    }
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [orders]);

  const clientLabelByKey = React.useMemo(
    () => new Map(clientOptions.map((row) => [row.key, row.label])),
    [clientOptions],
  );
  const productLabelByKey = React.useMemo(
    () => new Map(productOptions.map((row) => [row.key, row.label])),
    [productOptions],
  );

  const filteredOrders = React.useMemo(() => {
    const needle = search.trim().toLowerCase();

    return orders.filter((row) => {
      if (clientFilter !== "ALL" && row.clientKey !== clientFilter) return false;
      if (
        productFilter !== "ALL" &&
        !row.items.some((item) => item.productKey === productFilter)
      ) {
        return false;
      }

      if (!needle) return true;

      const orderNumber = formatFinancialDocumentNumber(row.orderFy, row.orderNo).toLowerCase();
      const text = [
        orderNumber,
        row.clientName.toLowerCase(),
        row.items.map((item) => item.productLabel.toLowerCase()).join(" "),
        row.items.map((item) => item.title.toLowerCase()).join(" "),
      ].join(" ");

      return text.includes(needle);
    });
  }, [orders, clientFilter, productFilter, search]);

  const filteredSummary = React.useMemo(() => {
    const totalPendingQty = filteredOrders.reduce(
      (sum, row) => sum + row.totalPendingQty,
      0,
    );
    const totalPendingLines = filteredOrders.reduce(
      (sum, row) => sum + row.items.length,
      0,
    );

    return {
      orderCount: filteredOrders.length,
      clientCount: new Set(filteredOrders.map((row) => row.clientName)).size,
      pendingLines: totalPendingLines,
      pendingQty: totalPendingQty,
    };
  }, [filteredOrders]);

  const pendingByClient = React.useMemo(() => {
    const map = new Map<string, { orders: number; qty: number }>();

    for (const row of filteredOrders) {
      const existing = map.get(row.clientName);
      if (existing) {
        existing.orders += 1;
        existing.qty += row.totalPendingQty;
      } else {
        map.set(row.clientName, { orders: 1, qty: row.totalPendingQty });
      }
    }

    return Array.from(map.entries())
      .map(([clientName, value]) => ({ clientName, ...value }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const pendingByProduct = React.useMemo(() => {
    const map = new Map<string, { qty: number; orders: Set<string> }>();

    for (const row of filteredOrders) {
      for (const item of row.items) {
        const key = item.productLabel;
        const existing = map.get(key);
        if (existing) {
          existing.qty += item.pendingQty;
          existing.orders.add(row.id);
        } else {
          map.set(key, { qty: item.pendingQty, orders: new Set([row.id]) });
        }
      }
    }

    return Array.from(map.entries())
      .map(([productLabel, value]) => ({
        productLabel,
        qty: value.qty,
        orders: value.orders.size,
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const printRows = React.useMemo(() => {
    return filteredOrders.flatMap((row) =>
      row.items.map((item) => ({
        id: `${row.id}-${item.id}`,
        orderLabel: formatFinancialDocumentNumber(row.orderFy, row.orderNo),
        clientName: row.clientName,
        productLabel: item.productLabel,
        status: row.status,
        deliveryDate: row.deliveryDate,
        pendingQty: item.pendingQty,
        orderedQty: item.orderedQty,
      })),
    );
  }, [filteredOrders]);

  const printPages = React.useMemo(
    () => chunkRows(printRows, PRINT_ROWS_PER_PAGE),
    [printRows],
  );

  const printFilterText = React.useMemo(() => {
    const chunks: string[] = [];

    if (clientFilter !== "ALL") {
      chunks.push(`Client: ${clientLabelByKey.get(clientFilter) || clientFilter}`);
    }
    if (productFilter !== "ALL") {
      chunks.push(`Product: ${productLabelByKey.get(productFilter) || productFilter}`);
    }
    if (search.trim()) chunks.push(`Search: ${search.trim()}`);

    return chunks.length > 0 ? chunks.join(" | ") : "All Data";
  }, [clientFilter, productFilter, search, clientLabelByKey, productLabelByKey]);

  const generatedAtLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(generatedAt));

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Pending Orders Board
            </h1>
            <p className="text-sm text-muted-foreground">
              Filter by client and product, then print this page as your working sheet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/sales/orders">Back to Orders</Link>
            </Button>
            <Button type="button" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Generated at: {generatedAtLabel}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Pending Orders" value={filteredSummary.orderCount} />
          <SummaryCard title="Clients" value={filteredSummary.clientCount} />
          <SummaryCard title="Pending Products" value={filteredSummary.pendingLines} />
          <SummaryCard title="Total Pending Qty" value={filteredSummary.pendingQty} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order no / client / product"
          />

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Clients</SelectItem>
              {clientOptions.map((client) => (
                <SelectItem key={client.key} value={client.key}>
                  {client.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              {productOptions.map((product) => (
                <SelectItem key={product.key} value={product.key}>
                  {product.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border p-2">
            <div className="px-2 pb-2 text-sm font-medium">Pending By Client</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Client</TableHead>
                  <TableHead className="text-white">Orders</TableHead>
                  <TableHead className="text-right text-white">Pending Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingByClient.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No pending orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingByClient.map((row) => (
                    <TableRow key={row.clientName}>
                      <TableCell>{row.clientName}</TableCell>
                      <TableCell>{row.orders}</TableCell>
                      <TableCell className="text-right font-medium">{row.qty}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border p-2">
            <div className="px-2 pb-2 text-sm font-medium">Pending By Product</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Product</TableHead>
                  <TableHead className="text-white">Orders</TableHead>
                  <TableHead className="text-right text-white">Pending Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingByProduct.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No pending products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingByProduct.map((row) => (
                    <TableRow key={row.productLabel}>
                      <TableCell>{row.productLabel}</TableCell>
                      <TableCell>{row.orders}</TableCell>
                      <TableCell className="text-right font-medium">{row.qty}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Order</TableHead>
                <TableHead className="text-white">Client</TableHead>
                <TableHead className="text-white">Pending Products</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-right text-white">Pending Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No pending orders match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top">
                      <div className="font-medium">
                        {formatFinancialDocumentNumber(row.orderFy, row.orderNo)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Order: {formatDate(row.orderDate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Delivery: {formatDate(row.deliveryDate)}
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="font-medium">{row.clientName}</div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs">
                        {row.items.map((item) => (
                          <div key={item.id} className="break-words">
                            <span className="font-medium">{item.productLabel}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              - pending {item.pendingQty} / ordered {item.orderedQty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <Badge
                        variant={getSalesOrderStatusBadge(row.status).variant}
                        className={getSalesOrderStatusBadge(row.status).className}>
                        {row.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right align-top font-semibold">
                      {row.totalPendingQty}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="hidden print:block text-black">
        {printPages.length === 0 ? (
          <div className="mx-auto w-[190mm] min-h-[277mm] border border-black/40 bg-white p-4">
            <div className="text-lg font-semibold">Pending Orders - Print Sheet</div>
            <div className="mt-1 text-xs">Generated: {generatedAtLabel}</div>
            <div className="text-xs">Filters: {printFilterText}</div>
            <div className="mt-8 text-sm">No pending orders found.</div>
          </div>
        ) : (
          printPages.map((pageRows, pageIndex) => {
            const pageStart = pageIndex * PRINT_ROWS_PER_PAGE;

            return (
              <div
                key={`print-page-${pageIndex}`}
                className="mx-auto w-[190mm] min-h-[277mm] break-after-page border border-black/40 bg-white p-4 last:break-after-auto">
                <div className="flex items-start justify-between border-b border-black pb-2">
                  <div>
                    <div className="text-lg font-semibold">Pending Orders - Work Sheet</div>
                    <div className="text-xs">Generated: {generatedAtLabel}</div>
                    <div className="text-xs">Filters: {printFilterText}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div>
                      Page {pageIndex + 1} / {printPages.length}
                    </div>
                    <div>Total Pending Qty: {filteredSummary.pendingQty}</div>
                  </div>
                </div>

                {pageIndex === 0 ? (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    <div className="rounded border border-black px-2 py-1">
                      Orders: <span className="font-semibold">{filteredSummary.orderCount}</span>
                    </div>
                    <div className="rounded border border-black px-2 py-1">
                      Clients: <span className="font-semibold">{filteredSummary.clientCount}</span>
                    </div>
                    <div className="rounded border border-black px-2 py-1">
                      Lines: <span className="font-semibold">{filteredSummary.pendingLines}</span>
                    </div>
                    <div className="rounded border border-black px-2 py-1">
                      Qty: <span className="font-semibold">{filteredSummary.pendingQty}</span>
                    </div>
                  </div>
                ) : null}

                <table className="mt-3 w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 text-left">#</th>
                      <th className="border border-black p-1 text-left">Order</th>
                      <th className="border border-black p-1 text-left">Client</th>
                      <th className="border border-black p-1 text-left">Product</th>
                      <th className="border border-black p-1 text-left">Delivery</th>
                      <th className="border border-black p-1 text-right">Pending</th>
                      <th className="border border-black p-1 text-right">Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, rowIndex) => (
                      <tr key={row.id}>
                        <td className="border border-black p-1">{pageStart + rowIndex + 1}</td>
                        <td className="border border-black p-1">
                          {row.orderLabel}
                          <div className="text-[10px]">{row.status}</div>
                        </td>
                        <td className="border border-black p-1">{row.clientName}</td>
                        <td className="border border-black p-1">{row.productLabel}</td>
                        <td className="border border-black p-1">
                          {formatDate(row.deliveryDate)}
                        </td>
                        <td className="border border-black p-1 text-right font-semibold">
                          {row.pendingQty}
                        </td>
                        <td className="border border-black p-1 text-right">{row.orderedQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border p-4 print:border-black/40">
      <div className="text-xs text-muted-foreground print:text-black/70">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
