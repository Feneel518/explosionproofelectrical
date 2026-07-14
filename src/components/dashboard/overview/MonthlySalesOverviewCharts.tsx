"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type {
  DashboardMonthlyCountPoint,
  DashboardMonthlyValuePoint,
} from "@/lib/actions/dashboard/getDashboardMonthlyTrendsAction";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";

type Props = {
  counts: DashboardMonthlyCountPoint[];
  values: DashboardMonthlyValuePoint[];
};

const countConfig = {
  quotations: {
    label: "Quotations",
    color: "#fb923c",
  },
  orders: {
    label: "Orders",
    color: "#f97316",
  },
  invoices: {
    label: "Invoices",
    color: "#ea580c",
  },
} satisfies ChartConfig;

const valueConfig = {
  orderValue: {
    label: "Order Value",
    color: "#f59e0b",
  },
  invoiceValue: {
    label: "Invoice Value",
    color: "#ea580c",
  },
} satisfies ChartConfig;

export default function MonthlySalesOverviewCharts({ counts, values }: Props) {
  const hasCountData = counts.some(
    (item) => item.quotations > 0 || item.orders > 0 || item.invoices > 0,
  );
  const hasValueData = values.some(
    (item) => item.orderValue > 0 || item.invoiceValue > 0,
  );

  const totalQuotations = counts.reduce((sum, row) => sum + row.quotations, 0);
  const totalOrders = counts.reduce((sum, row) => sum + row.orders, 0);
  const totalInvoices = counts.reduce((sum, row) => sum + row.invoices, 0);

  const totalOrderValue = values.reduce((sum, row) => sum + row.orderValue, 0);
  const totalInvoiceValue = values.reduce(
    (sum, row) => sum + row.invoiceValue,
    0,
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className=" py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">
            Current Month: Daily Documentskhe
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border  px-2 py-1">
              Quotations:{" "}
              <span className="font-semibold">{totalQuotations}</span>
            </div>
            <div className="rounded-md border  px-2 py-1">
              Orders: <span className="font-semibold">{totalOrders}</span>
            </div>
            <div className="rounded-md border  px-2 py-1">
              Invoices: <span className="font-semibold">{totalInvoices}</span>
            </div>
          </div>

          {hasCountData ? (
            <ChartContainer config={countConfig} className="h-80 w-full">
              <AreaChart data={counts} margin={{ left: 8, right: 8, top: 8 }}>
                <defs>
                  <linearGradient
                    id="fillQuotations"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-quotations)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-quotations)"
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                  <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-orders)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-orders)"
                      stopOpacity={0.03}
                    />
                  </linearGradient>
                  <linearGradient id="fillInvoices" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-invoices)"
                      stopOpacity={0.42}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-invoices)"
                      stopOpacity={0.03}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={28} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, key) => (
                        <div className="flex min-w-[140px] items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {String(key)}
                          </span>
                          <span className="font-medium">{Number(value)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent className="flex-wrap gap-3 text-xs" />
                  }
                />
                <Area
                  type="natural"
                  dataKey="quotations"
                  fill="url(#fillQuotations)"
                  stroke="var(--color-quotations)"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="natural"
                  dataKey="orders"
                  fill="url(#fillOrders)"
                  stroke="var(--color-orders)"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="natural"
                  dataKey="invoices"
                  fill="url(#fillInvoices)"
                  stroke="var(--color-invoices)"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              No quotation/order/invoice entries in current month yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">
            Current Month: Daily Value (INR)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border  px-2 py-1">
              Order Value:{" "}
              <span className="font-semibold">
                {formatCurrencyINR(totalOrderValue)}
              </span>
            </div>
            <div className="rounded-md border  px-2 py-1">
              Invoice Value:{" "}
              <span className="font-semibold">
                {formatCurrencyINR(totalInvoiceValue)}
              </span>
            </div>
          </div>

          {hasValueData ? (
            <ChartContainer config={valueConfig} className="h-80 w-full">
              <AreaChart data={values} margin={{ left: 8, right: 8, top: 8 }}>
                <defs>
                  <linearGradient
                    id="fillOrderValue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-orderValue)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-orderValue)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillInvoiceValue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-invoiceValue)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-invoiceValue)"
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis
                  width={52}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-IN", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(Number(value))
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, key) => (
                        <div className="flex min-w-[180px] items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {String(key)}
                          </span>
                          <span className="font-medium">
                            {formatCurrencyINR(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent className="flex-wrap gap-3 text-xs" />
                  }
                />
                <Area
                  type="natural"
                  dataKey="orderValue"
                  fill="url(#fillOrderValue)"
                  stroke="var(--color-orderValue)"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="natural"
                  dataKey="invoiceValue"
                  fill="url(#fillInvoiceValue)"
                  stroke="var(--color-invoiceValue)"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              No order/invoice value entries in current month yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
