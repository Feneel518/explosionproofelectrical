import { DeliveryChallanDashboardAnalytics } from "@/lib/types/deliveryChallanAnalytics";
import { FC } from "react";

interface Props {
  data: DeliveryChallanDashboardAnalytics["topCustomers"];
}

const TopCustomers: FC<Props> = ({ data }) => {
  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-4">
      <div className="uppercase text-xl">Top Customers</div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No customer data found.
          </div>
        ) : (
          data.map((item, index) => (
            <div
              key={`${item.customerId}-${index}`}
              className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="truncate pr-3">{item.customerName}</div>
              <div className="font-medium">{item.challans}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopCustomers;
