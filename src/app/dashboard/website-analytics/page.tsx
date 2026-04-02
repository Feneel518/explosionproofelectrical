import WebsiteTrafficAreaChart from "@/components/dashboard/overview/WebsiteTrafficAreaChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAuth } from "@/lib/check/requireAuth";
import { getWebsiteVisitorAnalyticsAction } from "@/lib/actions/dashboard/getWebsiteVisitorAnalyticsAction";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  const analytics = await getWebsiteVisitorAnalyticsAction(30);

  const generatedAtLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(analytics.generatedAt));

  const rangeLabel = `${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(analytics.range.from))} - ${new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(analytics.range.to))}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Website Visitor Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Frontend traffic intelligence for the last {analytics.range.days}{" "}
            days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Range: {rangeLabel}</Badge>
          <Badge variant="outline">Updated: {generatedAtLabel}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Page Views" value={analytics.totals.pageViews} />
        <MetricCard
          title="Unique Visitors"
          value={analytics.totals.uniqueVisitors}
        />
        <MetricCard title="Sessions" value={analytics.totals.uniqueSessions} />
        <MetricCard title="Countries" value={analytics.totals.countries} />
        <MetricCard
          title="Pages / Visitor"
          value={analytics.totals.avgPagesPerVisitor.toFixed(2)}
        />
      </div>

      <Card className=" py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">Daily Traffic Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <WebsiteTrafficAreaChart data={analytics.daily} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard title="Top Sources" rows={analytics.topSources} />
        <BreakdownCard title="Top Countries" rows={analytics.topCountries} />
        <BreakdownCard title="Top Devices" rows={analytics.topDevices} />

        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Page</TableHead>
                  <TableHead className="text-right text-white">Views</TableHead>
                  <TableHead className="text-right text-white">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topPages.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground">
                      No page views yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.topPages.map((row) => (
                    <TableRow key={row.path}>
                      <TableCell className="max-w-[320px] break-all">
                        {row.path}
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">
                        {row.percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-2">
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number; percentage: number }[];
}) {
  return (
    <Card className="py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Label</TableHead>
              <TableHead className="text-right text-white">Count</TableHead>
              <TableHead className="text-right text-white">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground">
                  No data yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="break-words">{row.label}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    {row.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
