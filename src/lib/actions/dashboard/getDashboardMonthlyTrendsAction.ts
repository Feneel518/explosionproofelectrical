"use server";

import { prisma } from "@/lib/prisma/db";

export type DashboardMonthlyCountPoint = {
  day: string;
  quotations: number;
  orders: number;
  invoices: number;
};

export type DashboardMonthlyValuePoint = {
  day: string;
  orderValue: number;
  invoiceValue: number;
};

export type DashboardMonthlyTrends = {
  counts: DashboardMonthlyCountPoint[];
  values: DashboardMonthlyValuePoint[];
};

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(date: Date) {
  return String(date.getDate()).padStart(2, "0");
}

function getCurrentMonthDaysUntilToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days: Date[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return days;
}

export async function getDashboardMonthlyTrendsAction(): Promise<DashboardMonthlyTrends> {
  const days = getCurrentMonthDaysUntilToday();
  const fromDate = days[0];

  const [quotations, orders, invoices] = await Promise.all([
    prisma.quotation.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: fromDate },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.salesOrder.findMany({
      where: {
        deletedAt: null,
        status: { not: "CANCELLED" },
        createdAt: { gte: fromDate },
      },
      select: {
        createdAt: true,
        grandTotal: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        status: { not: "CANCELLED" },
        invoiceDate: { gte: fromDate },
      },
      select: {
        invoiceDate: true,
        grandTotal: true,
      },
    }),
  ]);

  const countMap = new Map<string, DashboardMonthlyCountPoint>();
  const valueMap = new Map<string, DashboardMonthlyValuePoint>();

  for (const dayDate of days) {
    const key = dayKey(dayDate);
    const label = dayLabel(dayDate);

    countMap.set(key, {
      day: label,
      quotations: 0,
      orders: 0,
      invoices: 0,
    });

    valueMap.set(key, {
      day: label,
      orderValue: 0,
      invoiceValue: 0,
    });
  }

  for (const row of quotations) {
    const key = dayKey(row.createdAt);
    const item = countMap.get(key);
    if (item) item.quotations += 1;
  }

  for (const row of orders) {
    const key = dayKey(row.createdAt);
    const countItem = countMap.get(key);
    const valueItem = valueMap.get(key);

    if (countItem) countItem.orders += 1;
    if (valueItem) valueItem.orderValue += Number(row.grandTotal ?? 0);
  }

  for (const row of invoices) {
    const key = dayKey(row.invoiceDate);
    const countItem = countMap.get(key);
    const valueItem = valueMap.get(key);

    if (countItem) countItem.invoices += 1;
    if (valueItem) valueItem.invoiceValue += Number(row.grandTotal ?? 0);
  }

  return {
    counts: days
      .map((date) => countMap.get(dayKey(date)))
      .filter((row): row is DashboardMonthlyCountPoint => Boolean(row)),
    values: days
      .map((date) => valueMap.get(dayKey(date)))
      .filter((row): row is DashboardMonthlyValuePoint => Boolean(row)),
  };
}
