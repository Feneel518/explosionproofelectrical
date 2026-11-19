"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardMonthlyCountPoint, DashboardMonthlyValuePoint } from "@/lib/actions/dashboard/getDashboardMonthlyTrendsAction";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";

type Props = { counts: DashboardMonthlyCountPoint[]; values: DashboardMonthlyValuePoint[]; monthLabel?: string };
const valueConfig = {
  orderValue: { label: "Order value", color: "var(--overview-chart-orders, #fb923c)" },
  invoiceValue: { label: "Invoice value", color: "var(--overview-chart-invoices, #5eead4)" },
} satisfies ChartConfig;
const countConfig = {
  quotations: { label: "Quotations", color: "var(--overview-chart-quotes, #93c5fd)" },
  orders: { label: "Orders", color: "var(--overview-chart-orders, #fb923c)" },
  invoices: { label: "Invoices", color: "var(--overview-chart-invoices, #5eead4)" },
} satisfies ChartConfig;
const count = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const compact = (value: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export default function MonthlySalesOverviewCharts({ counts, values, monthLabel = "Current month" }: Props) {
  const totals = {
    quotations: counts.reduce((sum, d) => sum + d.quotations, 0),
    orders: counts.reduce((sum, d) => sum + d.orders, 0),
    invoices: counts.reduce((sum, d) => sum + d.invoices, 0),
    orderValue: values.reduce((sum, d) => sum + d.orderValue, 0),
    invoiceValue: values.reduce((sum, d) => sum + d.invoiceValue, 0),
  };
  const hasValues = values.some(d => d.orderValue !== 0 || d.invoiceValue !== 0);
  const hasCounts = counts.some(d => d.quotations > 0 || d.orders > 0 || d.invoices > 0);
  return (
    <Card className="overview-panel min-w-0 gap-0 py-0 sm:gap-0 sm:py-0">
      <Tabs defaultValue="value" className="gap-0">
        <CardHeader className="gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle><h2>Sales performance</h2></CardTitle><CardDescription className="mt-2">{monthLabel} · daily activity to date</CardDescription></div>
            <TabsList aria-label="Sales performance view"><TabsTrigger value="value">Value</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger></TabsList>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-5 sm:px-5">
          <TabsContent value="value" className="flex flex-col gap-5">
            <dl className="overview-chart-totals grid grid-cols-2 gap-4"><div><dt className="text-xs text-muted-foreground">Orders this month</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{formatCurrencyINR(totals.orderValue)}</dd></div><div><dt className="text-xs text-muted-foreground">Invoices this month</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{formatCurrencyINR(totals.invoiceValue)}</dd></div></dl>
            {hasValues ? <ChartContainer config={valueConfig} className="h-64 w-full min-w-0 aspect-auto sm:h-72" aria-label="Daily order and invoice values in INR">
              <ComposedChart accessibilityLayer data={values} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 5" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={compact} width={46} domain={[0, "auto"]} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={label => "Day " + label} formatter={(value, key) => <div className="flex min-w-40 justify-between gap-4"><span className="text-muted-foreground">{valueConfig[key as keyof typeof valueConfig]?.label || String(key)}</span><span className="font-medium tabular-nums">{formatCurrencyINR(Number(value))}</span></div>} />} />
                <ChartLegend content={<ChartLegendContent className="flex-wrap gap-4 pt-5" />} />
                <Bar dataKey="orderValue" fill="var(--color-orderValue)" fillOpacity={0.85} maxBarSize={18} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Line type="linear" dataKey="invoiceValue" stroke="var(--color-invoiceValue)" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </ComposedChart>
            </ChartContainer> : <EmptyChart text="No order or invoice values this month yet." />}
            <p className="text-xs leading-relaxed text-muted-foreground">Daily document values, not cash collections. Invoice values include drafts; cancelled orders and invoices are excluded.</p>
            <details className="overview-chart-data"><summary>View daily values</summary><div className="overflow-x-auto"><table><caption className="sr-only">Daily values in INR for {monthLabel}</caption><thead><tr><th scope="col">Day</th><th scope="col">Order value</th><th scope="col">Invoice value</th></tr></thead><tbody>{values.map(d => <tr key={d.day}><th scope="row">{d.day}</th><td>{formatCurrencyINR(d.orderValue)}</td><td>{formatCurrencyINR(d.invoiceValue)}</td></tr>)}</tbody></table></div></details>
          </TabsContent>
          <TabsContent value="documents" className="flex flex-col gap-5">
            <dl className="overview-chart-totals grid grid-cols-3 gap-3">{[["Quotations", totals.quotations], ["Orders", totals.orders], ["Invoices", totals.invoices]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{count(Number(value))}</dd></div>)}</dl>
            {hasCounts ? <ChartContainer config={countConfig} className="h-64 w-full min-w-0 aspect-auto sm:h-72" aria-label="Daily quotation, order, and invoice counts">
              <ComposedChart accessibilityLayer data={counts} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 5" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={label => "Day " + label} />} />
                <ChartLegend content={<ChartLegendContent className="flex-wrap gap-4 pt-5" />} />
                <Bar dataKey="quotations" fill="var(--color-quotations)" maxBarSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="orders" fill="var(--color-orders)" maxBarSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="invoices" fill="var(--color-invoices)" maxBarSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </ComposedChart>
            </ChartContainer> : <EmptyChart text="No quotations, orders, or invoices this month yet." />}
            <p className="text-xs leading-relaxed text-muted-foreground">Quotations and orders use their creation date. Invoices use their invoice date. Cancelled orders and invoices are excluded.</p>
            <details className="overview-chart-data"><summary>View daily document counts</summary><div className="overflow-x-auto"><table><caption className="sr-only">Daily document counts for {monthLabel}</caption><thead><tr><th scope="col">Day</th><th scope="col">Quotations</th><th scope="col">Orders</th><th scope="col">Invoices</th></tr></thead><tbody>{counts.map(d => <tr key={d.day}><th scope="row">{d.day}</th><td>{count(d.quotations)}</td><td>{count(d.orders)}</td><td>{count(d.invoices)}</td></tr>)}</tbody></table></div></details>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
function EmptyChart({ text }: { text: string }) {
  return <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 px-6 text-center sm:h-72"><ChartNoAxesCombined className="size-8 text-muted-foreground" aria-hidden="true" /><p className="text-sm font-medium">{text}</p><p className="max-w-72 text-xs leading-relaxed text-muted-foreground">Activity will appear here as documents are recorded.</p></div>;
}
