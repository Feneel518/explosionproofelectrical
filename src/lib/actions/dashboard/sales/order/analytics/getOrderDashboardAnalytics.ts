"use server";

import { prisma } from "@/lib/prisma/db";
import {
  DashboardAlertsType,
  HeatmapPoint,
  OrderDashboardAnalytics,
  OrderFunnelPoint,
  OrderMonthlyPoint,
  ProductionAlertItem,
  ProductionAlertsType,
  RecentOrderPoint,
  TopCustomerPoint,
  TopProductPoint,
} from "@/lib/types/OrderAnalyticsTypes";
import { SalesOrderStatus } from "@prisma/client";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

function toNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMonthKey(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOrderLabel(orderNo: number, orderFy: string) {
  return `SO/${formatFinancialDocumentNumber(orderFy, orderNo)}`;
}

function parseDeliveryDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

function isOpenOrder(status: SalesOrderStatus) {
  return ![SalesOrderStatus.CANCELLED, SalesOrderStatus.COMPLETED].includes(
    // @ts-ignore
    status,
  );
}

export async function getOrderDashboardAnalytics(): Promise<OrderDashboardAnalytics> {
  const orders = await prisma.salesOrder.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
        },
      },
      items: {
        select: {
          id: true,
          qty: true,
          lineGrandTotal: true,
          title: true,
          pendingQty: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  let draftOrders = 0;
  let confirmedOrders = 0;
  let inProductionOrders = 0;
  let partiallyDispatchedOrders = 0;
  let dispatchedOrders = 0;
  let partiallyInvoicedOrders = 0;
  let invoicedOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  let totalOrderValue = 0;
  let dispatchedValue = 0;
  let invoicedValue = 0;
  let completedValue = 0;
  let openOrderValue = 0;

  const monthlyMap = new Map<string, OrderMonthlyPoint>();
  const heatmapMap = new Map<string, HeatmapPoint>();
  const customerMap = new Map<string, TopCustomerPoint>();
  const productMap = new Map<string, TopProductPoint>();

  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  const alertItems: ProductionAlertItem[] = [];
  let overdueForDispatch = 0;
  let dueSoon = 0;

  for (const order of orders) {
    const orderValue = toNumber(order.grandTotal);
    const customerId = order.customer?.id ?? "unknown";
    const customerName =
      order.customer?.companyName ??
      order.clientNameSnapshot ??
      order.clientName ??
      "Unknown Customer";

    totalOrderValue += orderValue;

    if (order.status === SalesOrderStatus.DRAFT) draftOrders++;
    if (order.status === SalesOrderStatus.CONFIRMED) confirmedOrders++;
    if (order.status === SalesOrderStatus.IN_PRODUCTION) inProductionOrders++;
    if (order.status === SalesOrderStatus.PARTIALLY_DISPATCHED)
      partiallyDispatchedOrders++;
    if (order.status === SalesOrderStatus.DISPATCHED) dispatchedOrders++;
    if (order.status === SalesOrderStatus.PARTIALLY_INVOICED)
      partiallyInvoicedOrders++;
    if (order.status === SalesOrderStatus.INVOICED) invoicedOrders++;
    if (order.status === SalesOrderStatus.COMPLETED) completedOrders++;
    if (order.status === SalesOrderStatus.CANCELLED) cancelledOrders++;

    if (
      [
        SalesOrderStatus.PARTIALLY_DISPATCHED,
        SalesOrderStatus.DISPATCHED,
        // @ts-ignore
      ].includes(order.status)
    ) {
      dispatchedValue += orderValue;
    }

    if (
      [SalesOrderStatus.PARTIALLY_INVOICED, SalesOrderStatus.INVOICED].includes(
        // @ts-ignore
        order.status,
      )
    ) {
      invoicedValue += orderValue;
    }

    if (order.status === SalesOrderStatus.COMPLETED) {
      completedValue += orderValue;
    }

    if (isOpenOrder(order.status)) {
      openOrderValue += orderValue;
    }

    const monthKey = formatMonthKey(order.createdAt);
    const existingMonth = monthlyMap.get(monthKey);

    if (existingMonth) {
      existingMonth.count += 1;
      existingMonth.value += orderValue;
    } else {
      monthlyMap.set(monthKey, {
        month: monthKey,
        count: 1,
        value: orderValue,
      });
    }

    const dateKey = formatDateKey(order.createdAt);
    const existingDate = heatmapMap.get(dateKey);

    if (existingDate) {
      existingDate.count += 1;
    } else {
      heatmapMap.set(dateKey, {
        date: dateKey,
        count: 1,
      });
    }

    const existingCustomer = customerMap.get(customerId);
    if (existingCustomer) {
      existingCustomer.orders += 1;
      existingCustomer.value += orderValue;
    } else {
      customerMap.set(customerId, {
        customerId,
        customerName,
        orders: 1,
        value: orderValue,
      });
    }

    for (const item of order.items) {
      const productId = item.product?.id ?? item.productId ?? item.id;
      const productName = item.product?.name ?? item.title;
      const quantity = toNumber(item.qty);
      const lineValue = toNumber(item.lineGrandTotal);

      const existingProduct = productMap.get(productId);
      if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.value += lineValue;
      } else {
        productMap.set(productId, {
          productId,
          productName,
          quantity,
          value: lineValue,
        });
      }
    }

    const parsedDeliveryDate = parseDeliveryDate(order.deliveryDate);

    if (order.isOverdueForDispatch) {
      overdueForDispatch++;
      alertItems.push({
        id: order.id,
        orderNo: getOrderLabel(order.orderNo, order.orderFy),
        customerName,
        status: order.status,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        totalPendingQty: order.totalPendingQty,
      });
    } else if (
      parsedDeliveryDate &&
      parsedDeliveryDate >= today &&
      parsedDeliveryDate <= next7Days &&
      isOpenOrder(order.status)
    ) {
      dueSoon++;
      alertItems.push({
        id: order.id,
        orderNo: getOrderLabel(order.orderNo, order.orderFy),
        customerName,
        status: order.status,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        totalPendingQty: order.totalPendingQty,
      });
    }
  }

  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

  const monthly = Array.from(monthlyMap.values()).slice(-12);
  const heatmap = Array.from(heatmapMap.values()).slice(-120);

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const recentOrders: RecentOrderPoint[] = orders.slice(0, 10).map((order) => ({
    id: order.id,
    orderNo: getOrderLabel(order.orderNo, order.orderFy),
    customerName:
      order.customer?.companyName ??
      order.clientNameSnapshot ??
      order.clientName ??
      "Unknown Customer",
    status: order.status,
    totalAmount: toNumber(order.grandTotal),
    totalPendingQty: order.totalPendingQty,
    createdAt: order.createdAt,
  }));

  const funnel: OrderFunnelPoint[] = [
    { label: "Draft", value: draftOrders },
    { label: "Confirmed", value: confirmedOrders },
    { label: "Production", value: inProductionOrders },
    { label: "Dispatch", value: partiallyDispatchedOrders + dispatchedOrders },
    { label: "Completed", value: completedOrders },
  ];

  const productionAlerts: ProductionAlertsType = {
    overdueForDispatch,
    inProduction: inProductionOrders,
    draftOrders,
    dueSoon,
    items: alertItems.slice(0, 8),
  };

  const alerts: DashboardAlertsType = {
    overdueDispatchCount: overdueForDispatch,
    tooManyDrafts: draftOrders >= 10,
    tooManyOpenOrders:
      draftOrders +
        confirmedOrders +
        inProductionOrders +
        partiallyDispatchedOrders +
        dispatchedOrders +
        partiallyInvoicedOrders +
        invoicedOrders >
      30,
    lowCompletionRate:
      totalOrders > 0 ? completedOrders / totalOrders < 0.25 : false,
  };

  return {
    kpis: {
      totalOrders,
      draftOrders,
      confirmedOrders,
      inProductionOrders,
      partiallyDispatchedOrders,
      dispatchedOrders,
      partiallyInvoicedOrders,
      invoicedOrders,
      completedOrders,
      cancelledOrders,
      totalOrderValue,
      avgOrderValue,
    },
    monthly,
    revenue: {
      totalValue: totalOrderValue,
      dispatchedValue,
      invoicedValue,
      completedValue,
      openOrderValue,
      avgOrderValue,
    },
    funnel,
    productionAlerts,
    topCustomers,
    topProducts,
    heatmap,
    alerts,
    recentOrders,
  };
}
