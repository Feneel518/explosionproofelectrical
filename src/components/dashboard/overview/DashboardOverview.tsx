import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, CalendarDays,
  CheckCheck, CircleAlert, Factory, FileText, Globe2, PackageSearch, Plus, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import type { DashboardOverviewData } from "@/lib/actions/dashboard/getDashboardOverviewAction";
import type { DashboardMonthlyTrends } from "@/lib/actions/dashboard/getDashboardMonthlyTrendsAction";
import type { WebsiteVisitorAnalytics } from "@/lib/actions/dashboard/getWebsiteVisitorAnalyticsAction";
import MonthlySalesOverviewCharts from "./MonthlySalesOverviewCharts";
import DashboardRefreshButton from "./DashboardRefreshButton";

type Access = {
  sales: boolean; accounts: boolean; purchase: boolean; production: boolean;
  inventory: boolean; masters: boolean; createQuotation: boolean;
};
type Props = {
  name: string;
  overview: DashboardOverviewData;
  monthlyTrends: DashboardMonthlyTrends;
  websiteAnalytics: WebsiteVisitorAnalytics;
  access: Access;
  followups?: ReactNode;
};
const number = (value: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

export default function DashboardOverview({ name, overview: data, monthlyTrends, websiteAnalytics: web, access, followups }: Props) {
  const { sales, manufacturing, purchase, inventory, masters } = data;
  const stock = inventory.stock;
  const monthOrders = monthlyTrends.values.reduce((sum, day) => sum + day.orderValue, 0);
  const monthInvoices = monthlyTrends.values.reduce((sum, day) => sum + day.invoiceValue, 0);
  const monthOrderCount = monthlyTrends.counts.reduce((sum, day) => sum + day.orders, 0);
  const monthInvoiceCount = monthlyTrends.counts.reduce((sum, day) => sum + day.invoices, 0);
  const updated = new Date(data.generatedAt);
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(updated);
  const time = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(updated);
  const month = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(updated);
  const issues = [
    { label: "Overdue payments", count: sales.invoices.overduePaymentCount, detail: "Review invoices and follow up on collections.", href: access.accounts ? "/dashboard/sales/invoices" : undefined, urgent: true },
    { label: "Dispatches past due", count: sales.orders.overdueForDispatch, detail: "Check delivery commitments and pending quantities.", href: access.sales ? "/dashboard/sales/pending" : undefined, urgent: true },
    { label: "Negative stock balances", count: stock.negativeStockItems, detail: "Reconcile stock movements and opening balances.", href: access.inventory ? "/dashboard/inventory/stock" : undefined, urgent: true },
    { label: "Quotation follow-ups due", count: sales.quotations.followupDue, detail: "Reconnect with customers awaiting a response.", href: access.sales ? "/dashboard/sales/quotations" : undefined, urgent: false },
    { label: "Items at low stock", count: stock.lowStockItems, detail: `Available quantity at or below ${number(stock.lowStockThreshold)}.`, href: access.inventory ? "/dashboard/inventory/stock" : undefined, urgent: false },
    { label: "GRNs awaiting quality checks", count: purchase.grn.pendingQualityChecks, detail: "Complete incoming material verification.", href: access.purchase ? "/dashboard/purchase/grn" : undefined, urgent: false },
    { label: "GRNs with discrepancies", count: purchase.grn.discrepancies, detail: "Review differences in received materials.", href: access.purchase ? "/dashboard/purchase/grn" : undefined, urgent: false },
  ].filter(issue => issue.count > 0);
  const urgentCategories = issues.filter(issue => issue.urgent).length;
  const quoteStatuses = [
    { label: "Open", count: sales.quotations.open, tone: "open" },
    { label: "Won", count: sales.quotations.won, tone: "won" },
    { label: "Lost / closed", count: sales.quotations.lostOrClosed, tone: "closed" },
  ];
  const classifiedQuotations = quoteStatuses.reduce((sum, status) => sum + status.count, 0);

  return (
    <div className="business-overview flex min-w-0 flex-col gap-6 lg:gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Business overview</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Welcome back, {name}. Here’s where your business stands.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardRefreshButton />
          {access.createQuotation && <Button asChild><Link href="/dashboard/sales/quotations/new"><Plus data-icon="inline-start" />New quotation</Link></Button>}
        </div>
      </header>

      <div className="overview-dateline flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2"><CalendarDays className="size-3.5" aria-hidden="true" />{date}</span>
          <span>Financial year {data.currentFinancialYear}</span>
        </div>
        <span>Updated <time dateTime={data.generatedAt}>{time}</time> IST · Refresh for latest</span>
      </div>

      <section aria-label="Key business figures" className="overview-metrics grid sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Order value this month" value={formatCurrencyINR(monthOrders)} detail={`${number(monthOrderCount)} orders · ${month}`} href={access.sales ? "/dashboard/sales/orders" : undefined} accent />
        <Metric label="Invoice value this month" value={formatCurrencyINR(monthInvoices)} detail={`${number(monthInvoiceCount)} invoices · includes drafts`} href={access.accounts ? "/dashboard/sales/invoices" : undefined} />
        <Metric label="Awaiting payment" value={formatCurrencyINR(sales.invoices.paymentPendingAmount)} detail={`${number(sales.invoices.paymentPendingCount)} unpaid invoices · all time`} href={access.accounts ? "/dashboard/sales/invoices" : undefined} note={sales.invoices.overduePaymentCount > 0 ? `${number(sales.invoices.overduePaymentCount)} overdue` : undefined} />
        <Metric label="Pending orders this FY" value={number(sales.orders.pendingOrdersThisFy)} detail={`Of ${number(sales.orders.totalOrdersThisFy)} orders · FY ${data.currentFinancialYear}`} href={access.sales ? "/dashboard/sales/pending" : undefined} />
      </section>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <MonthlySalesOverviewCharts counts={monthlyTrends.counts} values={monthlyTrends.values} monthLabel={month} />
        <Card className="overview-panel gap-0 py-0 sm:gap-0 sm:py-0">
          <CardHeader className="gap-2 p-5 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle><h2>Needs attention</h2></CardTitle>
              <Badge variant="outline">{issues.length} {issues.length === 1 ? "category" : "categories"}</Badge>
            </div>
            <CardDescription>{urgentCategories > 0 ? `${urgentCategories} priority ${urgentCategories === 1 ? "area" : "areas"} to review first.` : "Your next actions across the business."}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-3">
            {issues.length ? <ul className="overview-attention-list">
              {issues.map(issue => (
                <li key={issue.label}>
                  <OptionalLink href={issue.href} className="overview-attention-row">
                    <CircleAlert className={cn("mt-0.5 size-4 shrink-0", issue.urgent ? "overview-danger" : "overview-warning")} aria-hidden="true" />
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{issue.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{issue.detail}</p></div>
                    <span className={cn("overview-count", issue.urgent ? "overview-danger" : "overview-warning")}>{number(issue.count)}</span>
                    {issue.href && <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  </OptionalLink>
                </li>
              ))}
            </ul> : <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"><CheckCheck className="overview-success size-8" /><p className="font-medium">You’re all caught up</p><p className="max-w-64 text-sm text-muted-foreground">No overdue payments, dispatch delays, follow-ups, or stock and receipt alerts.</p></div>}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="operations-heading" className="flex flex-col gap-4">
        <div><h2 id="operations-heading" className="text-xl font-semibold tracking-tight">Across your operations</h2><p className="mt-1 text-sm text-muted-foreground">From customer conversations to material on the floor.</p></div>
        <div className="grid min-w-0 gap-5 xl:grid-cols-3">
          <Card className="overview-panel gap-0 py-0 sm:gap-0 sm:py-0">
            <PanelHeader title="Sales pipeline" description="Quotation status · all time" icon={FileText} href={access.sales ? "/dashboard/sales/quotations/analytics" : undefined} />
            <CardContent className="flex flex-col gap-5 p-5 pt-0">
              <div className="flex items-baseline justify-between gap-3"><span className="text-sm text-muted-foreground">Total quotations</span><span className="text-2xl font-semibold tabular-nums">{number(sales.quotations.total)}</span></div>
              <div className="overview-status-bar" role="img" aria-label={quoteStatuses.map(s => `${s.label}: ${number(s.count)}`).join(", ")}>
                {classifiedQuotations > 0 && quoteStatuses.map(s => s.count > 0 && <span key={s.label} data-tone={s.tone} style={{ width: `${s.count / classifiedQuotations * 100}%` }} />)}
              </div>
              <div className="grid grid-cols-3 gap-3">{quoteStatuses.map(s => <div key={s.label}><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="overview-status-dot" data-tone={s.tone} />{s.label}</div><p className="mt-1.5 text-lg font-semibold tabular-nums">{number(s.count)}</p></div>)}</div>
              <dl className="overview-detail-list">
                <Detail label="Sent, not converted" value={number(sales.quotations.sentNotConverted)} />
                <Detail label="Orders awaiting dispatch" value={number(sales.orders.pendingDispatchOrders)} />
                <Detail label="Quantity to dispatch" value={number(sales.orders.pendingDispatchQty)} />
                <Detail label="Booked order value · all time" value={formatCurrencyINR(sales.orders.bookedValue)} />
                <Detail label="Payments due today" value={number(sales.invoices.dueTodayPaymentCount)} warning={sales.invoices.dueTodayPaymentCount > 0} />
              </dl>
              <PanelLink href={access.sales ? "/dashboard/sales/pending" : undefined}>Open dispatch board</PanelLink>
            </CardContent>
          </Card>

          <Card className="overview-panel gap-0 py-0 sm:gap-0 sm:py-0">
            <PanelHeader title="Production & purchase" description="Work in progress and incoming material" icon={Factory} href={access.production ? "/dashboard/manufacturing/planning" : undefined} />
            <CardContent className="flex flex-col gap-5 p-5 pt-0">
              <div className="overview-inline-highlight"><div><p className="text-sm text-muted-foreground">Active casting jobs</p><p className="mt-1 text-2xl font-semibold tabular-nums">{number(manufacturing.castingJob.inProgress + manufacturing.castingJob.partialReceived)}</p></div><Factory className="size-7 text-muted-foreground" aria-hidden="true" /></div>
              <dl className="overview-detail-list">
                <Detail label="Casting weight pending" value={`${number(manufacturing.castingJob.pendingWeightKg)} kg`} />
                <Detail label="Casting received · this month" value={`${number(manufacturing.castingJob.receivedWeightKgThisMonth)} kg`} />
                <Detail label="Material issued · this month" value={number(manufacturing.materialIssue.qtyIssuedThisMonth)} />
                <Detail label="Material returned · this month" value={number(manufacturing.materialIssue.qtyReturnedThisMonth)} />
                <Detail label="Material received · this month" value={number(purchase.grn.receivedQtyThisMonth)} />
                <Detail label="GRNs finalized / total" value={`${number(purchase.grn.finalized)} / ${number(purchase.grn.total)}`} />
                <Detail label="Direct sale issues · all time" value={number(manufacturing.materialIssue.directSale)} />
              </dl>
              <div className="flex flex-wrap gap-x-4 gap-y-2"><PanelLink href={access.production ? "/dashboard/manufacturing/casting-jobs" : undefined}>Casting jobs</PanelLink><PanelLink href={access.purchase ? "/dashboard/purchase/grn" : undefined}>Goods receipts</PanelLink></div>
            </CardContent>
          </Card>

          <Card className="overview-panel gap-0 py-0 sm:gap-0 sm:py-0">
            <PanelHeader title="Stock position" description={`${number(stock.trackedItems)} tracked items · current balances`} icon={Boxes} href={access.inventory ? "/dashboard/inventory/stock" : undefined} />
            <CardContent className="flex flex-col gap-5 p-5 pt-0">
              <div className="overview-stock-summary grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Available</p><p className="overview-success mt-1 text-2xl font-semibold tabular-nums">{number(stock.totalAvailable)}</p></div><div><p className="text-sm text-muted-foreground">Reserved</p><p className="mt-1 text-2xl font-semibold tabular-nums">{number(stock.totalReserved)}</p></div></div>
              <dl className="overview-detail-list">
                <Detail label="Total on hand" value={number(stock.totalOnHand)} />
                <Detail label="Low stock items" value={number(stock.lowStockItems)} warning={stock.lowStockItems > 0} />
                <Detail label="Negative stock items" value={number(stock.negativeStockItems)} warning={stock.negativeStockItems > 0} />
              </dl>
              <div className="flex flex-col gap-3"><p className="text-xs text-muted-foreground">Stock movements this month</p><div className="flex flex-wrap justify-between gap-3 text-sm"><span className="inline-flex items-center gap-1.5"><ArrowDownLeft className="overview-success size-4" />{number(stock.movementInThisMonth)} in</span><span className="inline-flex items-center gap-1.5"><ArrowUpRight className="overview-warning size-4" />{number(stock.movementOutThisMonth)} out</span></div></div>
              <div className="overview-material-note"><PackageSearch className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-muted-foreground">Highest pending material quantity · all time</p><p className="mt-1 break-words text-sm font-medium">{sales.orders.topPendingMaterial.title || "No pending material"}</p>{sales.orders.topPendingMaterial.qty > 0 && <p className="mt-1 text-xs text-muted-foreground">{number(sales.orders.topPendingMaterial.qty)} pending</p>}</div></div>
              <PanelLink href={access.inventory ? "/dashboard/inventory/stock" : undefined}>View stock summary</PanelLink>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="overview-panel gap-0 py-0 sm:gap-0 sm:py-0">
          <PanelHeader title="Website reach" description="Last 30 days · frontend traffic" icon={Globe2} href="/dashboard/website-analytics" />
          <CardContent className="flex flex-col gap-5 p-5 pt-0">
            <dl className="overview-web-totals grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Visitors", web.totals.uniqueVisitors], ["Page views", web.totals.pageViews], ["Sessions", web.totals.uniqueSessions], ["Countries", web.totals.countries]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1.5 text-xl font-semibold tabular-nums">{number(Number(value))}</dd></div>)}</dl>
            <dl className="overview-detail-list"><Detail label="Leading traffic source" value={web.topSources[0]?.label || "No traffic recorded"} /><Detail label="Most visited page" value={web.topPages[0]?.path || "No page views yet"} /><Detail label="Pages per visitor" value={number(web.totals.avgPagesPerVisitor)} /></dl>
            <PanelLink href="/dashboard/website-analytics">Explore website analytics</PanelLink>
          </CardContent>
        </Card>
        <Card className="overview-panel gap-0 py-0 sm:gap-0 sm:py-0">
          <PanelHeader title="Business directory" description="Active records / total records" icon={Users} href={access.masters ? "/dashboard/customers" : undefined} />
          <CardContent className="flex flex-col gap-5 p-5 pt-0">
            <dl className="overview-directory">{[
              { label: "Customers", data: masters.customers, href: "/dashboard/customers" },
              { label: "Suppliers", data: masters.suppliers, href: "/dashboard/suppliers" },
              { label: "Products", data: masters.products, href: "/dashboard/products" },
              { label: "Raw materials", data: masters.rawMaterials, href: "/dashboard/raw-materials" },
            ].map(row => <div key={row.label}><dt><OptionalLink href={access.masters ? row.href : undefined} className="overview-directory-link">{row.label}{access.masters && <ArrowUpRight className="size-3.5 text-muted-foreground" />}</OptionalLink></dt><dd className="tabular-nums"><strong className="font-semibold">{number(row.data.active)}</strong><span className="text-muted-foreground"> / {number(row.data.total)}</span></dd></div>)}</dl>
            <p className="text-xs leading-relaxed text-muted-foreground">Keep customer, supplier, and product records current for accurate documents and smoother operations.</p>
          </CardContent>
        </Card>
      </div>

      {followups && <section aria-labelledby="followups-heading" className="overview-followups flex flex-col gap-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="followups-heading" className="text-xl font-semibold tracking-tight">Keep conversations moving</h2><PanelLink href="/dashboard/sales/quotations">All quotations</PanelLink></div>{followups}</section>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs leading-relaxed text-muted-foreground"><span>ExEC · Sales, production & inventory</span><span>Values in INR · Periods are shown for each metric</span></footer>
    </div>
  );
}

function OptionalLink({ href, className, children }: { href?: string; className?: string; children: ReactNode }) {
  return href ? <Link href={href} className={className}>{children}</Link> : <div className={className}>{children}</div>;
}
function Metric({ label, value, detail, href, note, accent }: { label: string; value: string; detail: string; href?: string; note?: string; accent?: boolean }) {
  return <OptionalLink href={href} className={cn("overview-metric", accent && "overview-metric-accent")}><div className="flex items-center justify-between gap-3"><h2 className="text-sm text-muted-foreground">{label}</h2>{href && <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}</div><p className="overview-metric-value">{value}</p><p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>{note && <p className="overview-warning mt-2 text-xs font-medium">{note}</p>}</OptionalLink>;
}
function PanelHeader({ title, description, icon: Icon, href }: { title: string; description: string; icon: typeof Factory; href?: string }) {
  return <CardHeader className="gap-2 p-5"><div className="flex items-center justify-between gap-3"><CardTitle><h3>{title}</h3></CardTitle>{href ? <Link href={href} aria-label={`Open ${title.toLowerCase()}`} className="overview-icon-link"><Icon className="size-4" aria-hidden="true" /></Link> : <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}</div><CardDescription>{description}</CardDescription></CardHeader>;
}
function Detail({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className={cn("text-right font-medium tabular-nums", warning && "overview-warning")}>{value}</dd></div>;
}
function PanelLink({ href, children }: { href?: string; children: ReactNode }) {
  return href ? <Link href={href} className="overview-panel-link">{children}<ArrowRight className="size-3.5 shrink-0" aria-hidden="true" /></Link> : null;
}
