"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MonthlyDispatchPoint } from "@/lib/types/deliveryChallanAnalytics";
import { FC } from "react";

interface Props {
  data: MonthlyDispatchPoint[];
}

const chartConfig = {
  challans: {
    label: "Challans",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const MonthlyDispatchChart: FC<Props> = ({ data }) => {
  return (
    <div className="bg-muted row-span-2 p-4 text-woodsmoke-200 flex flex-col justify-between md:col-span-2">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Monthly Dispatch</div>
      </div>

      <div className="h-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar fill="var(--color-primary)" dataKey="challans" radius={8} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default MonthlyDispatchChart;
