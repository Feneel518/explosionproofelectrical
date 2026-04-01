"use server";

import { prisma } from "@/lib/prisma/db";
import { requireAuth } from "@/lib/check/requireAuth";
import {
  QuotationDashboardAnalytics,
  MonthlyQuotationPoint,
  TopCustomerItem,
  TopProductItem,
  SalespersonPerformanceItem,
  RecentQuotationItem,
} from "@/lib/types/quotationAnalytics";

import { QuotationStatus } from "@prisma/client";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (
    typeof value === "object" &&
    "toNumber" in (value as Record<string, unknown>)
  ) {
    const fn = (value as { toNumber?: () => number }).toNumber;
    if (typeof fn === "function") return fn() ?? 0;
  }
  return Number(value) || 0;
}

function quotationTotal(items: { qty: number; unitPrice: unknown }[]) {
  return items.reduce((sum, item) => {
    return sum + item.qty * Number(item.unitPrice);
  }, 0);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

const LOST_STATUSES: QuotationStatus[] = ["LOST", "EXPIRED", "CANCELLED"];
const PENDING_STATUSES: QuotationStatus[] = ["SENT", "FOLLOWUP"];
const FINALIZED_STATUSES: QuotationStatus[] = [
  "SENT",
  "FOLLOWUP",
  "WON",
  "LOST",
  "EXPIRED",
  "CANCELLED",
];

export async function getQuotationDashboardAnalytics(): Promise<QuotationDashboardAnalytics> {
  await requireAuth();

  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const tomorrowStart = startOfDay(addDays(new Date(), 1));
  const tomorrowEnd = endOfDay(addDays(new Date(), 1));

  const last12MonthsStart = new Date();
  last12MonthsStart.setMonth(last12MonthsStart.getMonth() - 11);
  last12MonthsStart.setDate(1);
  last12MonthsStart.setHours(0, 0, 0, 0);

  const [
    allQuotations,
    recentQuotationsRaw,
    followupsToday,
    followupsTomorrow,
    overdueFollowups,
    staleDraftsCount,
  ] = await Promise.all([
    prisma.quotation.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        quoteNo: true,
        quoteFy: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        nextFollowupAt: true,
        convertedToOrderAt: true,
        customerId: true,
        clientName: true,
        customer: {
          select: {
            companyName: true,
          },
        },
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            qty: true,
            unitPrice: true,
            productId: true,
            title: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.quotation.findMany({
      where: {
        deletedAt: null,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        quoteNo: true,
        quoteFy: true,
        status: true,
        createdAt: true,
        nextFollowupAt: true,
        clientName: true,
        customerId: true,
        customer: {
          select: {
            companyName: true,
          },
        },
        items: {
          select: {
            qty: true,
            unitPrice: true,
          },
        },
      },
    }),

    prisma.quotationFollowup.count({
      where: {
        doneAt: null,
        scheduledAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        quotation: {
          deletedAt: null,
        },
      },
    }),

    prisma.quotationFollowup.count({
      where: {
        doneAt: null,
        scheduledAt: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        quotation: {
          deletedAt: null,
        },
      },
    }),

    prisma.quotationFollowup.count({
      where: {
        doneAt: null,
        scheduledAt: {
          lt: todayStart,
        },
        quotation: {
          deletedAt: null,
        },
      },
    }),

    prisma.quotation.count({
      where: {
        deletedAt: null,
        status: "DRAFT",
        createdAt: {
          lt: addDays(todayStart, -3),
        },
      },
    }),
  ]);

  const totalQuotations = allQuotations.length;
  const draftQuotations = allQuotations.filter(
    (q) => q.status === "DRAFT",
  ).length;
  const sentQuotations = allQuotations.filter(
    (q) => q.status !== "DRAFT",
  ).length;
  const acceptedQuotations = allQuotations.filter(
    (q) => q.status === "WON" || q.convertedToOrderAt !== null,
  ).length;
  const rejectedQuotations = allQuotations.filter((q) =>
    LOST_STATUSES.includes(q.status),
  ).length;

  const conversionRate =
    sentQuotations > 0
      ? Number(((acceptedQuotations / sentQuotations) * 100).toFixed(2))
      : 0;

  let totalQuotationValue = 0;
  let acceptedValue = 0;
  let pendingValue = 0;
  let lostValue = 0;

  const monthlyMap = new Map<string, MonthlyQuotationPoint>();
  const customerMap = new Map<string, TopCustomerItem>();
  const productMap = new Map<string, TopProductItem>();
  const salespersonMap = new Map<string, SalespersonPerformanceItem>();
  const weekdayMap = new Map<string, number>([
    ["Sun", 0],
    ["Mon", 0],
    ["Tue", 0],
    ["Wed", 0],
    ["Thu", 0],
    ["Fri", 0],
    ["Sat", 0],
  ]);

  for (const quotation of allQuotations) {
    const total = quotationTotal(quotation.items);
    totalQuotationValue += total;

   

    const isAccepted =
      quotation.status === "WON" || quotation.convertedToOrderAt !== null;
    const isLost = LOST_STATUSES.includes(quotation.status);
    const isPending =
      PENDING_STATUSES.includes(quotation.status) ||
      quotation.status === "DRAFT";

    if (isAccepted) acceptedValue += total;
    if (isLost) lostValue += total;
    if (isPending) pendingValue += total;

    if (quotation.createdAt >= last12MonthsStart) {
      const key = monthKey(quotation.createdAt);
      const existing = monthlyMap.get(key);

      if (existing) {
        existing.quotations += 1;
        existing.value += total;
      } else {
        monthlyMap.set(key, {
          month: monthLabel(quotation.createdAt),
          quotations: 1,
          value: total,
        });
      }
    }

    const customerName =
      quotation.customer?.companyName ||
      quotation.clientName ||
      "Walk-in / Unknown";
    const customerKey = quotation.customerId || customerName;

    const existingCustomer = customerMap.get(customerKey);
    if (existingCustomer) {
      existingCustomer.quotations += 1;
      existingCustomer.totalValue += total;
    } else {
      customerMap.set(customerKey, {
        customerId: quotation.customerId,
        customerName,
        quotations: 1,
        totalValue: total,
      });
    }

    const userName =
      quotation.createdBy?.name || quotation.createdBy?.email || "Unknown User";
    const userKey = quotation.createdById || userName;

    const existingSalesperson = salespersonMap.get(userKey);
    if (existingSalesperson) {
      existingSalesperson.quotations += 1;
      existingSalesperson.totalValue += total;
      if (isAccepted) existingSalesperson.wonQuotations += 1;
    } else {
      salespersonMap.set(userKey, {
        userId: quotation.createdById,
        userName,
        quotations: 1,
        totalValue: total,
        wonQuotations: isAccepted ? 1 : 0,
      });
    }

    for (const item of quotation.items) {
      const productName = item.product?.name || item.title || "Custom Product";
      const productKey = item.productId || productName;

      const existingProduct = productMap.get(productKey);
      if (existingProduct) {
        existingProduct.quotationCount += 1;
        existingProduct.totalQty += item.qty;
      } else {
        productMap.set(productKey, {
          productId: item.productId,
          productName,
          quotationCount: 1,
          totalQty: item.qty,
        });
      }
    }

    const weekday = new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
    }).format(quotation.createdAt);
    weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + 1);
  }

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quotationCount - a.quotationCount)
    .slice(0, 5);

  const salespersonPerformance = Array.from(salespersonMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const recentQuotations: RecentQuotationItem[] = recentQuotationsRaw.map(
    (q) => ({
      id: q.id,
      quoteNo: q.quoteNo,
      quoteFy: q.quoteFy,
      customerName:
        q.customer?.companyName || q.clientName || "Walk-in / Unknown",
      value: quotationTotal(q.items),
      status: q.status,
      createdAt: q.createdAt,
      nextFollowupAt: q.nextFollowupAt,
    }),
  );

  const expiringSoon = allQuotations.filter((q) => {
    if (!q.nextFollowupAt) return false;
    return (
      q.nextFollowupAt >= todayStart &&
      q.nextFollowupAt <= endOfDay(addDays(new Date(), 2))
    );
  }).length;

  const heatmap = Array.from(weekdayMap.entries()).map(([day, quotations]) => ({
    day,
    quotations,
  }));

  return {
    kpis: {
      totalQuotations,
      draftQuotations,
      sentQuotations,
      acceptedQuotations,
      rejectedQuotations,
      conversionRate,
    },
    revenue: {
      totalQuotationValue,
      acceptedValue,
      pendingValue,
      lostValue,
    },
    monthly,
    funnel: {
      drafts: draftQuotations,
      sent: allQuotations.filter((q) => FINALIZED_STATUSES.includes(q.status))
        .length,
      negotiation: allQuotations.filter((q) => q.status === "FOLLOWUP").length,
      accepted: acceptedQuotations,
    },
    followups: {
      today: followupsToday,
      tomorrow: followupsTomorrow,
      overdue: overdueFollowups,
    },
    topCustomers,
    topProducts,
    salespersonPerformance,
    recentQuotations,
    alerts: {
      expiringSoon,
      followupsDueToday: followupsToday,
      staleDrafts: staleDraftsCount,
    },
    heatmap,
  };
}
