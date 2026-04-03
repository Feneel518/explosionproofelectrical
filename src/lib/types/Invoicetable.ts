import { Prisma, ProductMedia, ProductMediaKind } from "@prisma/client";

export const invoiceListSelect = {
  id: true,
  invoiceNo: true,
  invoiceFy: true,
  status: true,

  invoiceDate: true,
  dispatchDate: true,

  customerId: true,
  customer: {
    select: {
      id: true,
      companyName: true,
    },
  },

  salesOrderId: true,
  salesOrder: {
    select: {
      id: true,
      orderNo: true,
      orderFy: true,
      status: true,
      paymentTerms: true,
    },
  },

  clientNameSnapshot: true,
  gstinSnapshot: true,
  poNumber: true,
  poDate: true,

  subtotal: true,
  taxableTotal: true,
  gstTotal: true,
  grandTotal: true,

  emailedAt: true,
  paymentReceived: true,
  paymentReceivedAt: true,
  paymentReminderLastSentAt: true,
  paymentReminderCount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InvoiceSelect;

export type InvoiceListItem = Prisma.InvoiceGetPayload<{
  select: typeof invoiceListSelect;
}>;

export const invoiceCreateSalesOrderSelect = {
  id: true,
  orderNo: true,
  orderFy: true,
  orderVersion: true,
  status: true,

  customerId: true,
  customer: {
    select: {
      id: true,
      companyName: true,
      city: true,
      state: true,
      gstin: true,
    },
  },

  clientNameSnapshot: true,
  citySnapshot: true,
  stateSnapshot: true,
  gstinSnapshot: true,

  poNumber: true,
  poDate: true,
  orderDate: true,

  gst: true,
  subtotal: true,
  discountTotal: true,
  taxableTotal: true,
  gstTotal: true,
  grandTotal: true,

  totalOrderedQty: true,
  totalDispatchedQty: true,
  totalInvoicedQty: true,
  totalPendingQty: true,

  items: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    select: {
      id: true,
      salesOrderId: true,

      productId: true,
      variantId: true,

      title: true,
      sku: true,
      typeNumber: true,
      description: true,
      hsnCode: true,
      unit: true,

      qty: true,
      unitPrice: true,

      invoicedQty: true,
      dispatchedQty: true,
      pendingQty: true,

      lineSubtotal: true,
      lineGstTotal: true,
      lineGrandTotal: true,

      sortOrder: true,
    },
  },

  invoices: {
    orderBy: {
      createdAt: "desc" as const,
    },
    select: {
      id: true,
      invoiceNo: true,
      invoiceFy: true,
      status: true,
      invoiceDate: true,
      grandTotal: true,
    },
  },
} satisfies Prisma.SalesOrderSelect;

export type InvoiceCreateSalesOrder = Prisma.SalesOrderGetPayload<{
  select: typeof invoiceCreateSalesOrderSelect;
}>;

export type InvoiceDraftData = {
  header: {
    salesOrderId: string | null;
    customerId: string | null;

    invoiceDate: string | null;
    dueDate: string | null;

    poNumber: string;
    poDate: string | null;

    clientNameSnapshot: string;
    citySnapshot: string;
    stateSnapshot: string;
    gstinSnapshot: string;

    dispatchDate?: string | null;
    transporterName?: string | null;
    vehicleNumber?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    dispatchThrough?: string | null;
    lrNumber?: string | null;
    ewayBill?: string | null;
    remarks?: string | null;
    lrCopy?: {
      kind: ProductMediaKind;
      url: string;
      title?: string | null;
    }[];

    subtotal: number;
    discountTotal: number;
    taxableTotal: number;
    gstTotal: number;
    grandTotal: number;
  };

  items: {
    id: string;
    salesOrderItemId: string;
    isManual?: boolean;
    productId: string | null;
    variantId: string | null;

    title: string;
    sku: string | null;
    typeNumber: string | null;
    description: string | null;
    hsnCode: string | null;
    unit: string | null;

    orderedQty: number;
    alreadyInvoiced: number;
    alreadyDispatched: number;
    remainingQty: number;

    qty: number;
    unitPrice: number;

    cimfrNumber?: string | null;
    pesoNumber?: string | null;
    serialNumber?: string | null;
    selected?: boolean;
    productPicture?: {
      kind: ProductMediaKind;
      url: string;
      title?: string | null;
    }[];

    lineSubtotal: number;
    lineGstTotal: number;
    lineGrandTotal: number;

    sortOrder: number;
  }[];

  packages: {
    id?: string;
    packageNo: string;
    packageType: string | null;
    label: string | null;
    remarks: string | null;
    grossWeight: number | null;
    netWeight: number | null;
    items: {
      id?: string;
      salesOrderItemId?: string;
      invoiceItemDraftId?: string;
      qty: number;
    }[];
  }[];
};

export type InvoiceFormValues = InvoiceDraftData;

export type InvoiceFormCreationValues = {
  header: {
    salesOrderId: string | null;

    invoiceNo: number | null;
    invoiceFy: string;

    invoiceDate: Date | null;
    dispatchDate: Date | null;

    transporterName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    lrNumber: string;
    ewayBillNumber: string;

    lrCopyFile: ProductMedia | null;

    customerId: string | null;
    clientNameSnapshot: string;
    billingAddressSnapshot?: string | null;
    shippingAddressSnapshot?: string | null;

    orderIdSnapshot: string | null;
    orderNoSnapshot: number | null;
    orderFySnapshot: string | null;
    poNumberSnapshot?: string | null;
    poDateSnapshot?: string | null;

    subtotal: number;
    taxableTotal: number;
    gstTotal: number;
    grandTotal: number;

    totalSelectedItems: number;
    totalInvoiceQty: number;

    notes?: string | null;
  };

  orderItems: InvoiceOrderItemSelector[];
  selectedItems: InvoiceSelectedItem[];
};

export type InvoiceOrderItemSelector = {
  orderItemId: string;
  productId?: string | null;
  variantId?: string | null;

  title: string;
  description?: string | null;
  unit: string;

  orderedQty: number;
  alreadyInvoicedQty: number;
  pendingQty: number;

  unitPrice: number;
  gstRate?: number | null;

  originalTypeNumber?: string | null;

  selected: boolean;
};

export type InvoiceSelectedItem = {
  orderItemId: string;

  title: string;
  unit: string;

  orderedQty: number;
  pendingQty: number;
  invoiceQty: number;

  unitPrice: number;
  gstRate?: number | null;

  typeNumber: string;
  cimfrNumber: string;
  serialNumber: string;

  deliveredPhoto?: ProductMedia | null;

  packing: InvoicePackingRow[];
};

export type InvoicePackingRow = {
  id: string;
  boxNumber: string;
  quantity: number;
  remarks?: string | null;
};
