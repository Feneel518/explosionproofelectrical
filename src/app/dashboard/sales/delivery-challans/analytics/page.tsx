import ChallansByType from "@/components/dashboard/sales/delivery-challan/analytics/ChallansByType";
import DeliveryChallanKpiCards from "@/components/dashboard/sales/delivery-challan/analytics/DeliveryChallanKpiCards";
import MonthlyDispatchChart from "@/components/dashboard/sales/delivery-challan/analytics/MonthlyDispatchChart";
import OpenChallans from "@/components/dashboard/sales/delivery-challan/analytics/OpenChallans";
import OverdueReturnables from "@/components/dashboard/sales/delivery-challan/analytics/OverdueReturnables";
import TopCustomers from "@/components/dashboard/sales/delivery-challan/analytics/TopCustomers";
import { getDeliveryChallanDashboardAnalytics } from "@/lib/actions/dashboard/sales/delivery-challan/analytics/getDeliveryChallanDashboardAnalytics";
import { FC } from "react";

interface PageProps {}

const page: FC<PageProps> = async () => {
  const analytics = await getDeliveryChallanDashboardAnalytics();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DeliveryChallanKpiCards data={analytics.kpis} />

      <MonthlyDispatchChart data={analytics.monthlyDispatch} />

      <ChallansByType data={analytics.challansByType} />

      <TopCustomers data={analytics.topCustomers} />

      <OpenChallans data={analytics.openChallans} />

      <div className="md:col-span-2 xl:col-span-4">
        <OverdueReturnables data={analytics.overdueReturnables} />
      </div>
    </div>
  );
};

export default page;
