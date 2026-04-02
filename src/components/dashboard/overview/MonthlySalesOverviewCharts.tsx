"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
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
    color: "#f97316",
  },
  orders: {
    label: "Orders",
    color: "#fb923c",
  },
  invoices: {
    label: "Invoices",
    color: "#fdba74",
  },
} satisfies ChartConfig;

const valueConfig = {
  orderValue: {
    label: "Order Value",
    color: "#ea580c",
  },
  invoiceValue: {
    label: "Invoice Value",
    color: "#f97316",
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
  const totalInvoiceValue = values.reduce((sum, row) => sum + row.invoiceValue, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">Current Month: Daily Documents</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border px-2 py-1">
              Quotations: <span className="font-semibold">{totalQuotations}</span>
            </div>
            <div className="rounded-md border px-2 py-1">
              Orders: <span className="font-semibold">{totalOrders}</span>
            </div>
            <div className="rounded-md border px-2 py-1">
              Invoices: <span className="font-semibold">{totalInvoices}</span>
            </div>
          </div>

          {hasCountData ? (
            <ChartContainer config={countConfig} className="h-[320px] w-full">
              <LineChart data={counts} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={28} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, key) => (
                        <div className="flex min-w-[140px] items-center justify-between gap-4">
                          <span className="text-muted-foreground">{String(key)}</span>
                          <span className="font-medium">{Number(value)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="quotations"
                  stroke="var(--color-quotations)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-orders)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="invoices"
                  stroke="var(--color-invoices)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              No quotation/order/invoice entries in current month yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">Current Month: Daily Value (INR)</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border px-2 py-1">
              Order Value:{" "}
              <span className="font-semibold">{formatCurrencyINR(totalOrderValue)}</span>
            </div>
            <div className="rounded-md border px-2 py-1">
              Invoice Value:{" "}
              <span className="font-semibold">
                {formatCurrencyINR(totalInvoiceValue)}
              </span>
            </div>
          </div>

          {hasValueData ? (
            <ChartContainer config={valueConfig} className="h-[320px] w-full">
              <BarChart data={values} margin={{ left: 8, right: 8, top: 8 }}>
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
                          <span className="text-muted-foreground">{String(key)}</span>
                          <span className="font-medium">
                            {formatCurrencyINR(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Legend />
                <Bar
                  dataKey="orderValue"
                  fill="var(--color-orderValue)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="invoiceValue"
                  fill="var(--color-invoiceValue)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              No order/invoice value entries in current month yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
