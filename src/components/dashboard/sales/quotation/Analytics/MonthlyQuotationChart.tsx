"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MonthlyQuotationPoint } from "@/lib/types/quotationAnalytics";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";

interface Props {
  data: MonthlyQuotationPoint[];
}

const chartConfig = {
  quotations: {
    label: "Quotations",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function MonthlyQuotationChart({ data }: Props) {
  const totalQuotations = data.reduce((sum, item) => sum + item.quotations, 0);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const bestMonth =
    data.length > 0
      ? data.reduce((best, current) =>
          current.quotations > best.quotations ? current : best,
        )
      : null;

  const hasData = data.some((item) => item.quotations > 0 || item.value > 0);

  return (
    <div className="h-full mt-8">
      <div className="grid grid-cols-2  gap-4 mb-8   ">
        <div className="rounded-sm border border-white/20   p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Quotations
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">
            {totalQuotations}
          </p>
        </div>

        <div className="rounded-sm border border-white/20  p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Value
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">
            {formatCurrencyINR(totalValue)}
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-[340px]  items-center justify-center rounded-2xl border border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-sm font-medium">No quotation data available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly chart will appear once quotations are created
            </p>
          </div>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full rounded-2xl">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
            barCategoryGap={20}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              className="stroke-muted"
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              className="text-xs"
            />

            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, _name, item) => {
                    const row = item.payload as MonthlyQuotationPoint;

                    return (
                      <div className="min-w-[180px] space-y-2">
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-muted-foreground">
                            Quotations
                          </span>
                          <span className="font-semibold">{value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-muted-foreground">Value</span>
                          <span className="font-semibold">
                            {formatCurrencyINR(row.value)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />

            <Bar
              dataKey="quotations"
              fill="var(--color-primary)"
              radius={[12, 12, 4, 4]}
              maxBarSize={48}>
              <LabelList
                dataKey="quotations"
                position="top"
                offset={8}
                className="fill-foreground text-xs font-medium"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}

      <div className="flex flex-col gap-1 text-sm mt-8">
        {bestMonth ? (
          <>
            <div className="flex items-center gap-2 font-medium">
              Best month: {bestMonth.month} with {bestMonth.quotations}{" "}
              quotations
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Total quotation value this period is{" "}
              {formatCurrencyINR(totalValue)}.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            No performance insight available yet.
          </p>
        )}
      </div>
    </div>
  );
}
