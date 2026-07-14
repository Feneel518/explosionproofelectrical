"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { WebsiteTrafficPoint } from "@/lib/actions/dashboard/getWebsiteVisitorAnalyticsAction";

type Props = {
  data: WebsiteTrafficPoint[];
};

const chartConfig = {
  views: {
    label: "Page Views",
    color: "#f97316",
  },
  visitors: {
    label: "Unique Visitors",
    color: "#fb923c",
  },
  sessions: {
    label: "Sessions",
    color: "#fdba74",
  },
} satisfies ChartConfig;

export default function WebsiteTrafficAreaChart({ data }: Props) {
  const hasData = data.some(
    (point) => point.views > 0 || point.visitors > 0 || point.sessions > 0,
  );

  if (!hasData) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        No website visitor data yet.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[340px] w-full">
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.03} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} width={40} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, key) => (
                <div className="flex min-w-[170px] items-center justify-between gap-4">
                  <span className="text-muted-foreground">{String(key)}</span>
                  <span className="font-medium">{Number(value)}</span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent className="flex-wrap gap-3 text-xs" />} />

        <Area
          type="natural"
          dataKey="views"
          fill="url(#fillViews)"
          stroke="var(--color-views)"
          strokeWidth={2.2}
          fillOpacity={1}
          activeDot={{ r: 4 }}
        />
        <Area
          type="natural"
          dataKey="visitors"
          fill="url(#fillVisitors)"
          stroke="var(--color-visitors)"
          strokeWidth={2.2}
          fillOpacity={1}
          activeDot={{ r: 4 }}
        />
        <Area
          type="natural"
          dataKey="sessions"
          fill="url(#fillSessions)"
          stroke="var(--color-sessions)"
          strokeWidth={2.2}
          fillOpacity={1}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
