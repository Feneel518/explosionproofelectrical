import { Suspense } from "react";
import Link from "next/link";
import DashboardOverview from "@/components/dashboard/overview/DashboardOverview";
import QuotationFollowupReminderCard from "@/components/dashboard/sales/quotation/QuotationFollowupReminderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/lib/check/requireAuth";
import { hasPermission } from "@/lib/check/permissionPolicy";
import { getDashboardOverviewAction } from "@/lib/actions/dashboard/getDashboardOverviewAction";
import { getDashboardMonthlyTrendsAction } from "@/lib/actions/dashboard/getDashboardMonthlyTrendsAction";
import { getWebsiteVisitorAnalyticsAction } from "@/lib/actions/dashboard/getWebsiteVisitorAnalyticsAction";

export default async function Page() {
  const { user } = await requireAuth();
  if (!hasPermission(user, "analytics.read")) {
    const destinations = [
      ["sales.read", "/dashboard/enquiries", "Sales enquiries"],
      ["accounts.read", "/dashboard/sales/invoices", "Invoices"],
      ["purchase.read", "/dashboard/purchase/orders", "Purchasing"],
      ["inventory.read", "/dashboard/inventory/stock", "Inventory"],
      ["production.read", "/dashboard/manufacturing/planning", "Production"],
    ] as const;
    const available = destinations.filter(([permission]) => hasPermission(user, permission));
    return (
      <div className="flex flex-col gap-5 py-6">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user.name || "operator"}</h1>
        <p className="text-muted-foreground">Your workspace is ready. Choose a department to get started.</p>
        {available.length ? (
          <nav className="flex flex-wrap gap-3" aria-label="Your workspaces">
            {available.map(([, href, label]) => (
              <Link className="rounded-lg border px-5 py-3 underline-offset-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary" key={href} href={href}>{label}</Link>
            ))}
          </nav>
        ) : <p className="text-muted-foreground">Ask the owner to assign a department before accessing business records.</p>}
      </div>
    );
  }
  const [overview, monthlyTrends, websiteAnalytics] = await Promise.all([
    getDashboardOverviewAction(), getDashboardMonthlyTrendsAction(), getWebsiteVisitorAnalyticsAction(30),
  ]);
  const access = {
    sales: hasPermission(user, "sales.read"), accounts: hasPermission(user, "accounts.read"),
    purchase: hasPermission(user, "purchase.read"), production: hasPermission(user, "production.read"),
    inventory: hasPermission(user, "inventory.read"), masters: hasPermission(user, "master.read"),
    createQuotation: hasPermission(user, "sales.write"),
  };
  return <DashboardOverview name={user.name || "operator"} overview={overview} monthlyTrends={monthlyTrends} websiteAnalytics={websiteAnalytics} access={access}
    followups={access.sales ? <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}><QuotationFollowupReminderCard /></Suspense> : null} />;
}
