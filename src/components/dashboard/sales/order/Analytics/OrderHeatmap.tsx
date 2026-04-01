import { Separator } from "@/components/ui/separator";
import { HeatmapPoint } from "@/lib/types/OrderAnalyticsTypes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface OrderHeatmapProps {
  data: HeatmapPoint[];
}

const OrderHeatmap: FC<OrderHeatmapProps> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Order Activity</div>
        <Link
          href={"/dashboard/orders"}
          className="hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
          <ArrowUpRight />
        </Link>
      </div>

      <Separator className="bg-white/20" />

      <div className="grid grid-cols-5 gap-2">
        {data.slice(-30).map((item) => {
          const strength = item.count / max;

          return (
            <div
              key={item.date}
              className="rounded-md border p-2 text-center text-xs"
              style={{ opacity: Math.max(0.25, strength) }}
              title={`${item.date} • ${item.count} orders`}>
              {item.count}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing recent {Math.min(data.length, 30)} activity points
      </div>
    </div>
  );
};

export default OrderHeatmap;
