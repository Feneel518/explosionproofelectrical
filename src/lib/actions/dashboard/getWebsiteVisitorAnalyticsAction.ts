"use server";

import { prisma } from "@/lib/prisma/db";
import { getSourceLabel } from "@/lib/helpers/server/websiteVisitorAnalytics";

export type WebsiteTrafficPoint = {
  day: string;
  views: number;
  visitors: number;
  sessions: number;
};

export type WebsiteAnalyticsListRow = {
  label: string;
  count: number;
  percentage: number;
};

export type WebsiteTopPageRow = {
  path: string;
  count: number;
  percentage: number;
};

export type WebsiteVisitorAnalytics = {
  generatedAt: string;
  range: {
    from: string;
    to: string;
    days: number;
  };
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    countries: number;
    avgPagesPerVisitor: number;
  };
  daily: WebsiteTrafficPoint[];
  topSources: WebsiteAnalyticsListRow[];
  topCountries: WebsiteAnalyticsListRow[];
  topDevices: WebsiteAnalyticsListRow[];
  topPages: WebsiteTopPageRow[];
};

type CountableRow = {
  label: string;
  count: number;
};

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getLastNDays(days: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));

  const list: Date[] = [];
  for (let d = new Date(from); d <= today; d.setDate(d.getDate() + 1)) {
    list.push(new Date(d));
  }

  return {
    now,
    from,
    days: list,
  };
}

function toTopRows(
  rows: CountableRow[],
  total: number,
  top = 8,
): WebsiteAnalyticsListRow[] {
  return rows
    .sort((a, b) => b.count - a.count)
    .slice(0, top)
    .map((row) => ({
      label: row.label,
      count: row.count,
      percentage:
        total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
    }));
}

export async function getWebsiteVisitorAnalyticsAction(
  days = 30,
): Promise<WebsiteVisitorAnalytics> {
  const rangeDays = Math.max(7, Math.min(90, days));
  const { now, from, days: dayRange } = getLastNDays(rangeDays);

  const visits = await prisma.websiteVisit.findMany({
    where: {
      isFrontend: true,
      visitedAt: { gte: from },
    },
    select: {
      visitedAt: true,
      visitorId: true,
      sessionId: true,
      path: true,
      country: true,
      deviceType: true,
      sourceType: true,
      sourceHost: true,
      isSessionEntry: true,
    },
    orderBy: {
      visitedAt: "asc",
    },
  });

  const pageViews = visits.length;
  const uniqueVisitorsSet = new Set(visits.map((row) => row.visitorId));
  const uniqueSessionsSet = new Set(visits.map((row) => row.sessionId));
  const uniqueCountriesSet = new Set(
    visits.map((row) => row.country).filter((value): value is string => Boolean(value)),
  );

  const entryVisits = visits.filter((row) => row.isSessionEntry);
  const acquisitionVisits = entryVisits.length > 0 ? entryVisits : visits;

  const sourceMap = new Map<string, number>();
  for (const visit of acquisitionVisits) {
    const label = getSourceLabel(visit.sourceType, visit.sourceHost);
    sourceMap.set(label, (sourceMap.get(label) ?? 0) + 1);
  }

  const countryMap = new Map<string, number>();
  for (const visit of acquisitionVisits) {
    const key = visit.country || "Unknown";
    countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
  }

  const deviceMap = new Map<string, number>();
  for (const visit of visits) {
    const key = visit.deviceType
      .toLowerCase()
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    deviceMap.set(key, (deviceMap.get(key) ?? 0) + 1);
  }

  const pageMap = new Map<string, number>();
  for (const visit of visits) {
    pageMap.set(visit.path, (pageMap.get(visit.path) ?? 0) + 1);
  }

  const dailyMap = new Map<
    string,
    {
      day: string;
      views: number;
      visitors: Set<string>;
      sessions: Set<string>;
    }
  >();

  for (const date of dayRange) {
    const key = dayKey(date);
    dailyMap.set(key, {
      day: dayLabel(date),
      views: 0,
      visitors: new Set<string>(),
      sessions: new Set<string>(),
    });
  }

  for (const visit of visits) {
    const key = dayKey(visit.visitedAt);
    const point = dailyMap.get(key);
    if (!point) continue;
    point.views += 1;
    point.visitors.add(visit.visitorId);
    point.sessions.add(visit.sessionId);
  }

  const daily = dayRange
    .map((date) => dailyMap.get(dayKey(date)))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => ({
      day: row.day,
      views: row.views,
      visitors: row.visitors.size,
      sessions: row.sessions.size,
    }));

  const topSources = toTopRows(
    Array.from(sourceMap.entries()).map(([label, count]) => ({ label, count })),
    acquisitionVisits.length,
  );
  const topCountries = toTopRows(
    Array.from(countryMap.entries()).map(([label, count]) => ({ label, count })),
    acquisitionVisits.length,
  );
  const topDevices = toTopRows(
    Array.from(deviceMap.entries()).map(([label, count]) => ({ label, count })),
    pageViews,
    5,
  );
  const topPages = Array.from(pageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({
      path,
      count,
      percentage:
        pageViews > 0 ? Number(((count / pageViews) * 100).toFixed(1)) : 0,
    }));

  return {
    generatedAt: now.toISOString(),
    range: {
      from: from.toISOString(),
      to: now.toISOString(),
      days: rangeDays,
    },
    totals: {
      pageViews,
      uniqueVisitors: uniqueVisitorsSet.size,
      uniqueSessions: uniqueSessionsSet.size,
      countries: uniqueCountriesSet.size,
      avgPagesPerVisitor:
        uniqueVisitorsSet.size > 0
          ? Number((pageViews / uniqueVisitorsSet.size).toFixed(2))
          : 0,
    },
    daily,
    topSources,
    topCountries,
    topDevices,
    topPages,
  };
}
