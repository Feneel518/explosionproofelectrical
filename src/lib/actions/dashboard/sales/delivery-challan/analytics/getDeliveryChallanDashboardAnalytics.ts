"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { DeliveryChallanDashboardAnalytics } from "@/lib/types/deliveryChallanAnalytics";

function monthKey(date: Date) {
  return date.toLocaleString("en-IN", { month: "short" });
}

function daysBetween(from: Date, to: Date) {
  return Math.max(
    0,
    Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export async function getDeliveryChallanDashboardAnalytics(): Promise<DeliveryChallanDashboardAnalytics> {
  await requireAuth();

  const today = new Date();

  const [
    totalChallans,
    openChallansCount,
    pendingItemsAgg,
    overdueReturnablesCount,
    challansByTypeRaw,
    monthlyRaw,
    topCustomersRaw,
    openChallansRaw,
    overdueReturnablesRaw,
  ] = await Promise.all([
    prisma.deliveryChallan.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.deliveryChallan.count({
      where: {
        deletedAt: null,
        status: {
          in: ["ISSUED", "PARTIALLY_CLOSED"],
        },
      },
    }),

    prisma.deliveryChallanItem.aggregate({
      _sum: {
        pendingQty: true,
      },
      where: {
        deliveryChallan: {
          deletedAt: null,
          status: {
            in: ["ISSUED", "PARTIALLY_CLOSED"],
          },
        },
      },
    }),

    prisma.deliveryChallan.count({
      where: {
        deletedAt: null,
        type: "RETURNABLE",
        status: {
          in: ["ISSUED", "PARTIALLY_CLOSED"],
        },
        expectedReturnDate: {
          lt: today,
        },
      },
    }),

    prisma.deliveryChallan.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      where: {
        deletedAt: null,
      },
    }),

    prisma.deliveryChallan.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    }),

    prisma.deliveryChallan.groupBy({
      by: ["customerId"],
      _count: {
        id: true,
      },
      where: {
        deletedAt: null,
        customerId: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    }),

    prisma.deliveryChallan.findMany({
      where: {
        deletedAt: null,
        status: {
          in: ["ISSUED", "PARTIALLY_CLOSED"],
        },
      },
      select: {
        id: true,
        challanCode: true,
        type: true,
        status: true,
        issuedAt: true,
        customer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        issuedAt: "asc",
      },
      take: 10,
    }),

    prisma.deliveryChallan.findMany({
      where: {
        deletedAt: null,
        type: "RETURNABLE",
        status: {
          in: ["ISSUED", "PARTIALLY_CLOSED"],
        },
        expectedReturnDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        challanCode: true,
        expectedReturnDate: true,
        customer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        expectedReturnDate: "asc",
      },
      take: 10,
    }),
  ]);

  const customerIds = topCustomersRaw
    .map((c) => c.customerId)
    .filter((id): id is string => Boolean(id));

  const customers = customerIds.length
    ? await prisma.customer.findMany({
        where: {
          id: {
            in: customerIds,
          },
        },
        select: {
          id: true,
          companyName: true,
        },
      })
    : [];

  const customerMap = new Map(customers.map((c) => [c.id, c.companyName]));

  const monthMap = new Map<string, number>();
  monthlyRaw.forEach((row) => {
    const key = monthKey(row.date);
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });

  return {
    kpis: {
      totalChallans,
      openChallans: openChallansCount,
      pendingItems: Number(pendingItemsAgg._sum.pendingQty ?? 0),
      overdueReturnables: overdueReturnablesCount,
    },

    challansByType: challansByTypeRaw.map((item) => ({
      type: item.type,
      count: item._count.id,
    })),

    monthlyDispatch: Array.from(monthMap.entries()).map(
      ([month, challans]) => ({
        month,
        challans,
      }),
    ),

    topCustomers: topCustomersRaw.map((item) => ({
      customerId: item.customerId ?? "",
      customerName:
        customerMap.get(item.customerId ?? "") ?? "Unknown Customer",
      challans: item._count.id,
    })),

    openChallans: openChallansRaw.map((item) => ({
      id: item.id,
      challanCode: item.challanCode,
      customerName: item.customer?.companyName ?? "Unknown Customer",
      type: item.type,
      status: item.status,
      issuedAt: item.issuedAt ? item.issuedAt.toISOString() : null,
      daysOpen: item.issuedAt ? daysBetween(item.issuedAt, today) : 0,
    })),

    overdueReturnables: overdueReturnablesRaw.map((item) => ({
      id: item.id,
      challanCode: item.challanCode,
      customerName: item.customer?.companyName ?? "Unknown Customer",
      expectedReturnDate: item.expectedReturnDate
        ? item.expectedReturnDate.toISOString()
        : null,
      daysOverdue: item.expectedReturnDate
        ? daysBetween(item.expectedReturnDate, today)
        : 0,
    })),
  };
}
