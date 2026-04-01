export type KpiStats = {
  totalQuotations: number;
  draftQuotations: number;
  sentQuotations: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  conversionRate: number;
};

export type RevenuePipelineStats = {
  totalQuotationValue: number;
  acceptedValue: number;
  pendingValue: number;
  lostValue: number;
};

export type MonthlyQuotationPoint = {
  month: string;
  quotations: number;
  value: number;
};

export type ConversionFunnelStats = {
  drafts: number;
  sent: number;
  negotiation: number;
  accepted: number;
};

export type FollowupStats = {
  today: number;
  tomorrow: number;
  overdue: number;
};

export type TopCustomerItem = {
  customerId: string | null;
  customerName: string;
  quotations: number;
  totalValue: number;
};

export type TopProductItem = {
  productId: string | null;
  productName: string;
  quotationCount: number;
  totalQty: number;
};

export type SalespersonPerformanceItem = {
  userId: string | null;
  userName: string;
  quotations: number;
  totalValue: number;
  wonQuotations: number;
};

export type RecentQuotationItem = {
  id: string;
  quoteNo: number;
  quoteFy: string;
  customerName: string;
  value: number;
  status: string;
  createdAt: Date;
  nextFollowupAt: Date | null;
};

export type DashboardAlertsStats = {
  expiringSoon: number;
  followupsDueToday: number;
  staleDrafts: number;
};

export type HeatmapPoint = {
  day: string;
  quotations: number;
};

export type QuotationDashboardAnalytics = {
  kpis: KpiStats;
  revenue: RevenuePipelineStats;
  monthly: MonthlyQuotationPoint[];
  funnel: ConversionFunnelStats;
  followups: FollowupStats;
  topCustomers: TopCustomerItem[];
  topProducts: TopProductItem[];
  salespersonPerformance: SalespersonPerformanceItem[];
  recentQuotations: RecentQuotationItem[];
  alerts: DashboardAlertsStats;
  heatmap: HeatmapPoint[];
};
