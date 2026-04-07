import QuotationFollowupReminderCard from "@/components/dashboard/sales/quotation/QuotationFollowupReminderCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/check/requireAuth";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { getDashboardOverviewAction } from "@/lib/actions/dashboard/getDashboardOverviewAction";
import { getDashboardMonthlyTrendsAction } from "@/lib/actions/dashboard/getDashboardMonthlyTrendsAction";
import { getWebsiteVisitorAnalyticsAction } from "@/lib/actions/dashboard/getWebsiteVisitorAnalyticsAction";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  FileWarning,
  Globe2,
  HandCoins,
  LayoutDashboard,
  PackageSearch,
} from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import MonthlySalesOverviewCharts from "@/components/dashboard/overview/MonthlySalesOverviewCharts";

const page: FC = async () => {
  await requireAuth();
  const [overview, monthlyTrends, websiteAnalytics] = await Promise.all([
    getDashboardOverviewAction(),
    getDashboardMonthlyTrendsAction(),
    getWebsiteVisitorAnalyticsAction(30),
  ]);

  const generatedAt = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(overview.generatedAt));

  const quickCards = [
    {
      title: "Pending Orders (FY)",
      value: `${overview.sales.orders.pendingOrdersThisFy} / ${overview.sales.orders.totalOrdersThisFy}`,
      subtitle: `${overview.currentFinancialYear} financial year`,
      icon: ClipboardList,
      href: "/dashboard/sales/orders",
      alert: overview.sales.orders.pendingOrdersThisFy > 0,
    },
    {
      title: "Top Pending Qty Material",
      value: overview.sales.orders.topPendingMaterial.qty,
      subtitle:
        overview.sales.orders.topPendingMaterial.title ??
        "No pending material found",
      icon: PackageSearch,
      href: "/dashboard/sales/pending",
      alert: overview.sales.orders.topPendingMaterial.qty > 0,
    },
    {
      title: "Payment Pending",
      value: overview.sales.invoices.paymentPendingCount,
      subtitle: formatCurrencyINR(overview.sales.invoices.paymentPendingAmount),
      icon: HandCoins,
      href: "/dashboard/sales/invoices",
      alert: overview.sales.invoices.overduePaymentCount > 0,
    },
    {
      title: "Low Stock Items",
      value: overview.inventory.stock.lowStockItems,
      subtitle: `Threshold <= ${overview.inventory.stock.lowStockThreshold}`,
      icon: Boxes,
      href: "/dashboard/inventory/stock",
      alert: overview.inventory.stock.lowStockItems > 0,
    },
    {
      title: "Website Visitors (30d)",
      value: websiteAnalytics.totals.uniqueVisitors,
      subtitle: `${websiteAnalytics.totals.pageViews} page views / ${websiteAnalytics.totals.countries} countries`,
      icon: Globe2,
      href: "/dashboard/website-analytics",
      alert: false,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview across masters, sales, purchase, manufacturing, and stock.
          </p>
        </div>

        <Badge variant="outline">Updated: {generatedAt}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="py-4">
              <CardHeader className="px-4 pb-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pt-2">
                <div className="text-2xl font-semibold">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.subtitle}</div>
                <Button asChild variant="link" className="h-auto p-0 pt-3">
                  <Link href={card.href} className="inline-flex items-center gap-1">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                {card.alert ? (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                    <FileWarning className="h-3.5 w-3.5" />
                    Needs attention
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MonthlySalesOverviewCharts
        counts={monthlyTrends.counts}
        values={monthlyTrends.values}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <StatRow
              label="Customers"
              value={`${overview.masters.customers.active} active / ${overview.masters.customers.total} total`}
            />
            <StatRow
              label="Suppliers"
              value={`${overview.masters.suppliers.active} active / ${overview.masters.suppliers.total} total`}
            />
            <StatRow
              label="Products"
              value={`${overview.masters.products.active} active / ${overview.masters.products.total} total`}
            />
            <StatRow
              label="Raw Materials"
              value={`${overview.masters.rawMaterials.active} active / ${overview.masters.rawMaterials.total} total`}
            />
            <ActionLink href="/dashboard/customers" title="Open Masters" />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Sales Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <StatRow
              label="Quotation Sent (Not Converted)"
              value={`${overview.sales.quotations.sentNotConverted} quotation(s)`}
            />
            <StatRow
              label="Pending Orders (FY)"
              value={`${overview.sales.orders.pendingOrdersThisFy} / ${overview.sales.orders.totalOrdersThisFy}`}
              isAlert={overview.sales.orders.pendingOrdersThisFy > 0}
            />
            <StatRow
              label="Follow-up Due"
              value={`${overview.sales.quotations.followupDue} quotation(s)`}
              isAlert={overview.sales.quotations.followupDue > 0}
            />
            <StatRow
              label="Booked Value"
              value={formatCurrencyINR(overview.sales.orders.bookedValue)}
            />
            <StatRow
              label="Payments Overdue"
              value={`${overview.sales.invoices.overduePaymentCount} invoice(s)`}
              isAlert={overview.sales.invoices.overduePaymentCount > 0}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <ActionLink href="/dashboard/sales/orders" title="Orders" />
              <ActionLink href="/dashboard/sales/pending" title="Pending Board" />
              <ActionLink href="/dashboard/sales/invoices" title="Invoices" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Purchase + Manufacturing</CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <StatRow
              label="GRN"
              value={`${overview.purchase.grn.finalized} finalized / ${overview.purchase.grn.total} total`}
            />
            <StatRow
              label="GRN Checks Pending"
              value={`${overview.purchase.grn.pendingQualityChecks} GRN(s)`}
              isAlert={overview.purchase.grn.pendingQualityChecks > 0}
            />
            <StatRow
              label="GRN Discrepancies"
              value={`${overview.purchase.grn.discrepancies} GRN(s)`}
              isAlert={overview.purchase.grn.discrepancies > 0}
            />
            <StatRow
              label="Material Issued (Month)"
              value={`${overview.manufacturing.materialIssue.qtyIssuedThisMonth} qty`}
            />
            <StatRow
              label="Direct Sale Issues"
              value={`${overview.manufacturing.materialIssue.directSale} issue(s)`}
            />
            <StatRow
              label="Casting Jobs In Progress"
              value={`${overview.manufacturing.castingJob.inProgress + overview.manufacturing.castingJob.partialReceived} job(s)`}
              isAlert={
                overview.manufacturing.castingJob.inProgress +
                  overview.manufacturing.castingJob.partialReceived >
                0
              }
            />
            <StatRow
              label="Casting Pending Weight"
              value={`${overview.manufacturing.castingJob.pendingWeightKg.toFixed(3)} kg`}
              isAlert={overview.manufacturing.castingJob.pendingWeightKg > 0}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <ActionLink href="/dashboard/purchase/grn" title="GRN" />
              <ActionLink
                href="/dashboard/manufacturing/material-issues"
                title="Material Issues"
              />
              <ActionLink
                href="/dashboard/manufacturing/casting-jobs"
                title="Casting Jobs"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Inventory Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <StatRow
              label="Tracked Items"
              value={`${overview.inventory.stock.trackedItems} item(s)`}
            />
            <StatRow
              label="On Hand / Available"
              value={`${overview.inventory.stock.totalOnHand} / ${overview.inventory.stock.totalAvailable}`}
            />
            <StatRow
              label="Reserved"
              value={`${overview.inventory.stock.totalReserved}`}
            />
            <StatRow
              label="Negative Stock"
              value={`${overview.inventory.stock.negativeStockItems} item(s)`}
              isAlert={overview.inventory.stock.negativeStockItems > 0}
            />
            <StatRow
              label="Movements (Month)"
              value={`IN ${overview.inventory.stock.movementInThisMonth} / OUT ${overview.inventory.stock.movementOutThisMonth}`}
            />
            <ActionLink href="/dashboard/inventory/stock" title="Open Stock Summary" />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <LayoutDashboard className="h-4 w-4" />
          Quotation Follow-ups
        </div>
        <QuotationFollowupReminderCard />
      </div>
    </div>
  );
};

export default page;

function StatRow({
  label,
  value,
  isAlert,
}: {
  label: string;
  value: string;
  isAlert?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className={isAlert ? "font-semibold text-destructive" : "font-medium"}>
        {value}
      </div>
    </div>
  );
}

function ActionLink({ href, title }: { href: string; title: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href} className="inline-flex items-center gap-1">
        {title}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}
