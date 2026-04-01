import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductionAlertsType } from "@/lib/types/OrderAnalyticsTypes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface ProductionAlertsProps {
  data: ProductionAlertsType;
}

const ProductionAlerts: FC<ProductionAlertsProps> = ({ data }) => {
  const cards = [
    { title: "Overdue For Dispatch", value: data.overdueForDispatch },
    { title: "In Production", value: data.inProduction },
    { title: "Draft Orders", value: data.draftOrders },
    { title: "Due Soon", value: data.dueSoon },
  ];

  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Production Alerts</div>
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
                <h3>{card.value}</h3>
              </div>
              {index !== cards.length - 1 && (
                <Separator className="m-2 w-full bg-white/20" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Priority Orders
        </div>

        {data.items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No urgent orders right now.
          </div>
        ) : (
          data.items.slice(0, 4).map((item, index) => (
            <div key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{item.orderNo}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pending Qty: {item.totalPendingQty}
                  </div>
                </div>

                <Badge variant="secondary">{item.status}</Badge>
              </div>

              {index !== Math.min(data.items.length, 4) - 1 && (
                <Separator className="m-2 w-full bg-white/20" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductionAlerts;
