import ConversionFunnel from "@/components/dashboard/sales/order/Analytics/ConversionFunnel";
import DashboardAlerts from "@/components/dashboard/sales/order/Analytics/DashboardAlerts";
import MonthlyOrderChart from "@/components/dashboard/sales/order/Analytics/MonthlyOrderChart";
import OrderHeatmap from "@/components/dashboard/sales/order/Analytics/OrderHeatmap";
import OrderKpiCards from "@/components/dashboard/sales/order/Analytics/OrderKpiCards";
import OrderRevenueStats from "@/components/dashboard/sales/order/Analytics/OrderRevenueStats";
import ProductionAlerts from "@/components/dashboard/sales/order/Analytics/ProductionAlerts";
import RecentOrders from "@/components/dashboard/sales/order/Analytics/RecentOrders";
import TopCustomers from "@/components/dashboard/sales/order/Analytics/TopCustomers";
import TopProducts from "@/components/dashboard/sales/order/Analytics/TopProducts";
import { getOrderDashboardAnalytics } from "@/lib/actions/dashboard/sales/order/analytics/getOrderDashboardAnalytics";
import { FC } from "react";

interface PageProps {}

const page: FC<PageProps> = async () => {
  const analytics = await getOrderDashboardAnalytics();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="col-span-2 row-span-2">
        <OrderKpiCards data={analytics.kpis} />
      </div>

      <div className="col-span-1 row-span-2 flex flex-col justify-between  bg-muted p-4 lg:col-span-2">
        <MonthlyOrderChart data={analytics.monthly} />
      </div>

      <OrderRevenueStats data={analytics.revenue} />
      <ConversionFunnel data={analytics.funnel} />

      <ProductionAlerts data={analytics.productionAlerts} />

      <TopCustomers data={analytics.topCustomers} />

      <TopProducts data={analytics.topProducts} />

      <OrderHeatmap data={analytics.heatmap} />

      <div className="col-span-2">
        <DashboardAlerts data={analytics.alerts} />
      </div>

      <div className="col-span-1 lg:col-span-4">
        <RecentOrders data={analytics.recentOrders} />
      </div>
    </div>
  );
};

export default page;
