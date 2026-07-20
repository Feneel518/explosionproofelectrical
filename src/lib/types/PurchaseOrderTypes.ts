export type PurchaseOrderDraft = {
  supplierId: string;
  orderDate: string;
  expectedDate?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  shippingAddress?: string | null;
  remarks?: string | null;
  terms?: string | null;
  shippingAmount: number;
  items: Array<{
    id: string;
    rawMaterialId: string | null;
    title: string;
    supplierItemName?: string | null;
    itemCode?: string | null;
    hsnCode?: string | null;
    unit: string;
    qty: number;
    unitPrice: number;
    discountPercent: number;
    gstPercent: number;
    remarks?: string | null;
  }>;
};

export const emptyPurchaseOrderDraft = (): PurchaseOrderDraft => ({
  supplierId: "",
  orderDate: new Date().toISOString(),
  expectedDate: null,
  paymentTerms: "30 days",
  deliveryTerms: "Delivery at our works",
  shippingAddress: "Plot no. 920, GIDC, phase 4, Vapi, Gujarat, India",
  remarks: "",
  terms: "Please mention our purchase order number on your invoice and delivery documents.",
  shippingAmount: 0,
  items: [],
});
