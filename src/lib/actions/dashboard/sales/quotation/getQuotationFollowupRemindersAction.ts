"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function getQuotationFollowupRemindersAction() {
  await requireAuth();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const upcomingEnd = endOfDay(addDays(now, 3));
  const activeQuotationWhere: Prisma.QuotationWhereInput = {
    deletedAt: null,
    convertedToOrderAt: null,
    status: {
      notIn: ["WON", "LOST", "CANCELLED"],
    },
  };

  const [overdue, today, upcoming] = await Promise.all([
    prisma.quotation.findMany({
      where: {
        ...activeQuotationWhere,
        nextFollowupAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        quoteNo: true,
        quoteFy: true,
        clientName: true,
        receivedFromName: true,
        nextFollowupAt: true,
        customer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        nextFollowupAt: "asc",
      },
      take: 20,
    }),

    prisma.quotation.findMany({
      where: {
        ...activeQuotationWhere,
        nextFollowupAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        id: true,
        quoteNo: true,
        quoteFy: true,
        clientName: true,
        receivedFromName: true,
        nextFollowupAt: true,
        customer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        nextFollowupAt: "asc",
      },
      take: 20,
    }),

    prisma.quotation.findMany({
      where: {
        ...activeQuotationWhere,
        nextFollowupAt: {
          gt: todayEnd,
          lte: upcomingEnd,
        },
      },
      select: {
        id: true,
        quoteNo: true,
        quoteFy: true,
        clientName: true,
        receivedFromName: true,
        nextFollowupAt: true,
        customer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        nextFollowupAt: "asc",
      },
      take: 20,
    }),
  ]);

  return {
    ok: true as const,
    overdue,
    today,
    upcoming,
    counts: {
      overdue: overdue.length,
      today: today.length,
      upcoming: upcoming.length,
    },
  };
}
