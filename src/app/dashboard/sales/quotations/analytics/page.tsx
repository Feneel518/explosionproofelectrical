import ConversionFunnel from "@/components/dashboard/sales/quotation/Analytics/ConversionFunnel";
import DashboardAlerts from "@/components/dashboard/sales/quotation/Analytics/DashboardAlerts";
import FollowupAlerts from "@/components/dashboard/sales/quotation/Analytics/FollowupAlerts";
import MonthlyQuotationChart from "@/components/dashboard/sales/quotation/Analytics/MonthlyQuotationChart";
import QuotationHeatmap from "@/components/dashboard/sales/quotation/Analytics/QuotationHeatmap";
import QuotationKpiCards from "@/components/dashboard/sales/quotation/Analytics/QuotationKpiCards";
import QuotationRevenueStats from "@/components/dashboard/sales/quotation/Analytics/QuotationRevenueStats";
import RecentQuotations from "@/components/dashboard/sales/quotation/Analytics/RecentQuotations";
import TopCustomers from "@/components/dashboard/sales/quotation/Analytics/TopCustomers";
import TopProducts from "@/components/dashboard/sales/quotation/Analytics/TopProducts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getQuotationDashboardAnalytics } from "@/lib/actions/dashboard/sales/quotation/analytics/getQuotationDashboardAnalytics";
import { ArrowUpRight, DotSquare } from "lucide-react";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  const analytics = await getQuotationDashboardAnalytics();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* 1st */}
      <QuotationKpiCards data={analytics.kpis} />

      {/* 2nd */}
      <div className="bg-muted row-span-2 p-4 text-woodsmoke-200 flex flex-col justify-between md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Monthly Quotation </div>
        </div>
        <MonthlyQuotationChart data={analytics.monthly} />
      </div>

      {/* 3rd */}
      <QuotationRevenueStats data={analytics.revenue} />

      {/* 4th */}
      <ConversionFunnel data={analytics.funnel} />

      {/* 5th */}
      <FollowupAlerts data={analytics.followups} />

      {/* 6th */}
      <TopCustomers data={analytics.topCustomers} />

      <TopProducts data={analytics.topProducts} />

      <div className="row-span-2">
        <QuotationHeatmap data={analytics.heatmap} />
      </div>

      <DashboardAlerts data={analytics.alerts} />

      <div className="md:col-span-2">
        <RecentQuotations data={analytics.recentQuotations} />
      </div>
    </div>
  );
};

export default page;
