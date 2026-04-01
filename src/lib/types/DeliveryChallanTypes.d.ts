export type DeliveryChallanDraftHeader = {
  type?: "TO_BE_BILLED" | "JOB_WORK" | "SAMPLE" | "RETURNABLE";
  partyType?: "CUSTOMER" | "VENDOR" | "OTHER";

  date?: Date | null;
  poNumber?: string | null;

  quotationId?: string | null;
  customerId?: string | null;

  transporterName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  dispatchThrough?: string | null;
  lrNumber?: string | null;
  numberOfPackages?: number | null;
  remarks?: string | null;

  expectedReturnDate?: Date | null;
  expectedClosureDate?: Date | null;
};

export type DeliveryChallanDraftItem = {
  id: string;
  kind: "PRODUCT" | "RAW_MATERIAL";

  productId?: string | null;

  title: string;
  sku?: string | null;
  typeNumber?: string | null;
  description?: string | null;
  hsnCode?: string | null;
  unit?: string | null;

  qty: number | string;
  closedQty: number | string;
  pendingQty: number | string;

  sortOrder: number;
};

export type DeliveryChallanDraftData = {
  header: DeliveryChallanDraftHeader;
  items: DeliveryChallanDraftItem[];
};
