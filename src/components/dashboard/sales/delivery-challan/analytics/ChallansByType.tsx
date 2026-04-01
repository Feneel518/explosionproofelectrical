"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DeliveryChallanTypePoint } from "@/lib/types/deliveryChallanAnalytics";
import { FC } from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Props {
  data: DeliveryChallanTypePoint[];
}

const chartConfig = {
  count: {
    label: "Challans",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const ChallansByType: FC<Props> = ({ data }) => {
  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col justify-between">
      <div className="uppercase text-xl">Challans by Type</div>

      <div className="h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              outerRadius={95}
            />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default ChallansByType;
