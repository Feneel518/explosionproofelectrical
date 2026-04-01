import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { RecentOrderPoint } from "@/lib/types/OrderAnalyticsTypes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface RecentOrdersProps {
  data: RecentOrderPoint[];
}

const RecentOrders: FC<RecentOrdersProps> = ({ data }) => {
  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Recent Orders</div>
        <Link
          href={"/dashboard/orders"}
          className="hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
          <ArrowUpRight />
        </Link>
      </div>

      <div>
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent orders.</div>
        ) : (
          data.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3>{item.orderNo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pending Qty: {item.totalPendingQty}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <h3>{formatCurrencyINR(item.totalAmount)}</h3>
                  <Badge variant="secondary">{item.status}</Badge>
                </div>
              </div>

              {index !== data.length - 1 && (
                <Separator className="m-2 w-full bg-white/20" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
