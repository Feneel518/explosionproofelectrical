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
import PrintSalesOrderButton from "@/components/customerCopy/sales-order/PrintSalesOrderButton";

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
  poNumber: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
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

    return orders.flatMap((row) => {
      if (clientFilter !== "ALL" && row.clientKey !== clientFilter) return [];
      const matchesOrder = [
        formatFinancialDocumentNumber(row.orderFy, row.orderNo), row.clientName, row.poNumber || "",
      ].some((value) => value.toLowerCase().includes(needle));
      const items = row.items.filter((item) =>
        item.pendingQty > 0 &&
        (productFilter === "ALL" || item.productKey === productFilter) &&
        (!needle || matchesOrder || [item.productLabel, item.title].some((value) => value.toLowerCase().includes(needle))),
      );
      if (!items.length) return [];
      return [{ ...row, items, totalPendingQty: items.reduce((sum, item) => sum + item.pendingQty, 0) }];
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
      clientCount: new Set(filteredOrders.map((row) => row.clientKey)).size,
      pendingLines: totalPendingLines,
      pendingQty: totalPendingQty,
    };
  }, [filteredOrders]);

  const pendingByClient = React.useMemo(() => {
    const map = new Map<string, { clientName: string; orders: number; qty: number }>();

    for (const row of filteredOrders) {
      const existing = map.get(row.clientKey);
      if (existing) {
        existing.orders += 1;
        existing.qty += row.totalPendingQty;
      } else {
        map.set(row.clientKey, { clientName: row.clientName, orders: 1, qty: row.totalPendingQty });
      }
    }

    return Array.from(map.entries())
      .map(([clientKey, value]) => ({ clientKey, ...value }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const pendingByProduct = React.useMemo(() => {
    const map = new Map<string, { productLabel: string; qty: number; orders: Set<string> }>();

    for (const row of filteredOrders) {
      for (const item of row.items) {
        const key = item.productKey;
        const existing = map.get(key);
        if (existing) {
          existing.qty += item.pendingQty;
          existing.orders.add(row.id);
        } else {
          map.set(key, { productLabel: item.productLabel, qty: item.pendingQty, orders: new Set([row.id]) });
        }
      }
    }

    return Array.from(map.entries())
      .map(([productKey, value]) => ({
        productKey,
        productLabel: value.productLabel,
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
        poNumber: row.poNumber,
        clientName: row.clientName,
        productLabel: item.productLabel,
        status: row.status,
        deliveryDate: row.deliveryDate,
        pendingQty: item.pendingQty,
        orderedQty: item.orderedQty,
      })),
    );
  }, [filteredOrders]);

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
    timeZone: "Asia/Kolkata",
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
              Confirmed orders with quantities still to be invoiced. Filters apply to items, totals, and the printed worksheet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/sales/orders">Back to Orders</Link>
            </Button>
            <Button type="button" onClick={() => window.print()} disabled={!filteredOrders.length}>
              <Printer className="mr-2 h-4 w-4" />
              Print Pending Sheet
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Generated at: {generatedAtLabel}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Pending Orders" value={filteredSummary.orderCount} />
          <SummaryCard title="Clients" value={filteredSummary.clientCount} />
          <SummaryCard title="Pending Item Lines" value={filteredSummary.pendingLines} />
          <SummaryCard title="Total Pending Qty" value={filteredSummary.pendingQty} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order no / PO no / client / product"
            aria-label="Search pending orders"
          />

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger aria-label="Filter by client">
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
            <SelectTrigger aria-label="Filter by product">
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

        {clientFilter !== "ALL" || productFilter !== "ALL" || search ? (
          <Button variant="ghost" onClick={() => { setClientFilter("ALL"); setProductFilter("ALL"); setSearch(""); }}>
            Clear Filters
          </Button>
        ) : null}

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
                    <TableRow key={row.clientKey}>
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
                    <TableRow key={row.productKey}>
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
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No pending orders match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top">
                      <Link
                        href={`/dashboard/sales/orders/${row.id}`}
                        className="font-medium text-primary hover:underline">
                        {formatFinancialDocumentNumber(row.orderFy, row.orderNo)}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        PO: {row.poNumber || "-"}
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
                              {" "} / dispatched {item.dispatchedQty} / invoiced {item.invoicedQty}
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
                    <TableCell className="text-right align-top">
                      <PrintSalesOrderButton orderId={row.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div data-pending-orders-print className="hidden print:block bg-white text-black">
        <h1 className="text-lg font-semibold">Pending Orders - Work Sheet</h1>
        <p className="text-xs">Generated: {generatedAtLabel} IST</p>
        <p className="text-xs">Filters: {printFilterText}</p>
        <p className="my-3 text-xs">
          Orders: {filteredSummary.orderCount} | Clients: <span>{filteredSummary.clientCount}</span> | Lines: {filteredSummary.pendingLines} | Total Pending Qty: {filteredSummary.pendingQty}
        </p>
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-[5%] border border-black p-1 text-left">#</th>
              <th className="w-[17%] border border-black p-1 text-left">Order</th>
              <th className="w-[19%] border border-black p-1 text-left">Client</th>
              <th className="w-[27%] border border-black p-1 text-left">Product</th>
              <th className="w-[14%] border border-black p-1 text-left">Delivery</th>
              <th className="w-[9%] border border-black p-1 text-right">Pending</th>
              <th className="w-[9%] border border-black p-1 text-right">Ordered</th>
            </tr>
          </thead>
          <tbody>
            {printRows.map((row, index) => (
              <tr key={row.id}>
                <td className="border border-black p-1">{index + 1}</td>
                <td className="border border-black p-1">{row.orderLabel}<div className="text-[10px]">PO: {row.poNumber || "-"}</div><div className="text-[10px]">{row.status.replaceAll("_", " ")}</div></td>
                <td className="border border-black p-1">{row.clientName}</td>
                <td className="border border-black p-1">{row.productLabel}</td>
                <td className="border border-black p-1">{formatDate(row.deliveryDate)}</td>
                <td className="border border-black p-1 text-right font-semibold">{row.pendingQty}</td>
                <td className="border border-black p-1 text-right">{row.orderedQty}</td>
              </tr>
            ))}
            {!printRows.length ? <tr><td colSpan={7} className="border border-black p-4 text-center">No pending orders found.</td></tr> : null}
          </tbody>
        </table>
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
