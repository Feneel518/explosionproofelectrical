export interface DeliveryChallanKpiStats {
  totalChallans: number;
  openChallans: number;
  pendingItems: number;
  overdueReturnables: number;
}

export interface DeliveryChallanTypePoint {
  type: "TO_BE_BILLED" | "JOB_WORK" | "SAMPLE" | "RETURNABLE";
  count: number;
}

export interface MonthlyDispatchPoint {
  month: string;
  challans: number;
}

export interface TopCustomerPoint {
  customerId: string;
  customerName: string;
  challans: number;
}

export interface OpenChallanPoint {
  id: string;
  challanCode: string;
  customerName: string;
  type: string;
  status: string;
  issuedAt: string | null;
  daysOpen: number;
}

export interface OverdueReturnablePoint {
  id: string;
  challanCode: string;
  customerName: string;
  expectedReturnDate: string | null;
  daysOverdue: number;
}

export interface DeliveryChallanDashboardAnalytics {
  kpis: DeliveryChallanKpiStats;
  challansByType: DeliveryChallanTypePoint[];
  monthlyDispatch: MonthlyDispatchPoint[];
  topCustomers: TopCustomerPoint[];
  openChallans: OpenChallanPoint[];
  overdueReturnables: OverdueReturnablePoint[];
}
