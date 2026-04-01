import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { OrderRevenueStatsType } from "@/lib/types/OrderAnalyticsTypes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface OrderRevenueStatsProps {
  data: OrderRevenueStatsType;
}

const OrderRevenueStats: FC<OrderRevenueStatsProps> = ({ data }) => {
  const cards = [
    { title: "Total Order Value", value: data.totalValue },
    { title: "Open Order Value", value: data.openOrderValue },
    { title: "Dispatched Value", value: data.dispatchedValue },
    { title: "Invoiced Value", value: data.invoicedValue },
    { title: "Completed Value", value: data.completedValue },
    { title: "Avg Order Value", value: data.avgOrderValue },
  ];

  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Revenue</div>
        <Link
          href={"/dashboard/orders"}
          className="hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
          <ArrowUpRight />
        </Link>
      </div>

      <div>
        {cards.map((card, index) => {
          return (
            <div key={index}>
              <div className="flex items-end justify-between gap-4">
                <h3>{card.title}</h3>
                <h3 className="text-right">{formatCurrencyINR(card.value)}</h3>
              </div>
              {index !== cards.length - 1 && (
                <Separator className="m-2 w-full bg-white/20" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderRevenueStats;
