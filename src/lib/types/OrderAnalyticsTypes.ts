import { SalesOrderStatus } from "@prisma/client";

export type OrderAnalyticsKpis = {
  totalOrders: number;
  draftOrders: number;
  confirmedOrders: number;
  inProductionOrders: number;
  partiallyDispatchedOrders: number;
  dispatchedOrders: number;
  partiallyInvoicedOrders: number;
  invoicedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  avgOrderValue: number;
};

export type OrderMonthlyPoint = {
  month: string;
  count: number;
  value: number;
};

export type OrderRevenueStatsType = {
  totalValue: number;
  dispatchedValue: number;
  invoicedValue: number;
  completedValue: number;
  openOrderValue: number;
  avgOrderValue: number;
};

export type OrderFunnelPoint = {
  label: string;
  value: number;
};

export type ProductionAlertItem = {
  id: string;
  orderNo: string;
  customerName: string;
  status: SalesOrderStatus;
  orderDate: Date | null;
  createdAt: Date;
  deliveryDate: string | null;
  totalPendingQty: number;
};

export type ProductionAlertsType = {
  overdueForDispatch: number;
  inProduction: number;
  draftOrders: number;
  dueSoon: number;
  items: ProductionAlertItem[];
};

export type TopCustomerPoint = {
  customerId: string;
  customerName: string;
  orders: number;
  value: number;
};

export type TopProductPoint = {
  productId: string;
  productName: string;
  quantity: number;
  value: number;
};

export type HeatmapPoint = {
  date: string;
  count: number;
};

export type DashboardAlertsType = {
  overdueDispatchCount: number;
  tooManyDrafts: boolean;
  tooManyOpenOrders: boolean;
  lowCompletionRate: boolean;
};

export type RecentOrderPoint = {
  id: string;
  orderNo: string;
  customerName: string;
  status: SalesOrderStatus;
  totalAmount: number;
  totalPendingQty: number;
  createdAt: Date;
};

export type OrderDashboardAnalytics = {
  kpis: OrderAnalyticsKpis;
  monthly: OrderMonthlyPoint[];
  revenue: OrderRevenueStatsType;
  funnel: OrderFunnelPoint[];
  productionAlerts: ProductionAlertsType;
  topCustomers: TopCustomerPoint[];
  topProducts: TopProductPoint[];
  heatmap: HeatmapPoint[];
  alerts: DashboardAlertsType;
  recentOrders: RecentOrderPoint[];
};
