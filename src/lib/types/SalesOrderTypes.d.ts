import {
  GST,
  PackingCharges,
  PaymentTerms,
  SalesOrderSourceType,
  TransportationPayment,
} from "@prisma/client";

export type SalesOrderDraftComponent = {
  id: string;
  item: string;
  unit?: string | null;
  qty?: string | null;
};

export type SalesOrderDraftItem = {
  id: string;
  productId?: string | null;
  variantId?: string | null;

  title: string;
  sku?: string | null;
  typeNumber?: string | null;
  description?: string | null;
  rating?: string | null;
  terminals?: string | null;
  hardware?: string | null;
  gasket?: string | null;
  mounting?: string | null;
  cableEntry?: string | null;
  earthing?: string | null;
  hsnCode?: string | null;
  cutoutSize?: string | null;
  plateSize?: string | null;
  glass?: string | null;
  wireGuard?: string | null;
  variantType?: string | null;
  size?: string | null;
  rpm?: string | null;
  kW?: string | null;
  horsePower?: string | null;
  poReference?: string | null;

  showVariantImages?: boolean;
  showVariantDrawings?: boolean;

  selectedVariantImageIds: string[];
  selectedVariantDrawingIds: string[];

  variantImagesSnapshot?: any[];
  variantDrawingsSnapshot?: any[];

  qty: number | string;
  unit?: string | null;
  unitPrice: number | string;

  component: SalesOrderDraftComponent[];
  sortOrder: number;
};

export type SalesOrderDraftHeader = {
  customerId?: string | null;
  clientName?: string | null;

  quotationId?: string | null;

  receivedFromName?: string | null;
  receivedFromPhone?: string | null;
  receivedFromEmail?: string | null;

  poNumber?: string | null;
  poDate?: string | Date | null;
  orderDate?: string | Date | null;

  poFile?: {
    id: string;
    url: string;
    title?: string | null;
  }[];

  additionalNotes?: string | null;
  deliveryDate?: string | null;

  gst: GST;
  packingCharges: PackingCharges;
  paymentTerms: PaymentTerms;
  transportationPayment: TransportationPayment;
  discount?: string | null;
  sourceType?: SalesOrderSourceType;
  isConvertedFromQuotation?: boolean;
};

export type SalesOrderDraftData = {
  header: SalesOrderDraftHeader;
  items: SalesOrderDraftItem[];
};

import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { SalesOrderFormValues } from "@/lib/validators/dashboard/sales/orders/OrderValidator";

export type CustomerSelectItem = {
  id: string;
  companyName: string | null;
  clientName?: string | null;
  city?: string | null;
  state?: string | null;
  gstin?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
};

export type PendingQuotationItem = {
  id: string;
  label: string;
  quoteNo: number;
  quoteFy: string;
  status: string;
  clientName: string | null;
  receivedFromName: string | null;
  createdAt: string;
  quotation: any;
};

export type SalesOrderFormType = UseFormReturn<SalesOrderFormValues>;

export type SalesOrderItemField = FieldArrayWithId<
  SalesOrderFormValues,
  "items",
  "id"
>;

import { Prisma } from "@prisma/client";

export type GetSalesOrderByIdData = Prisma.SalesOrderGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        companyName: true;
        city: true;
        state: true;
        gstin: true;
        companyPhone: true;
        companyEmail: true;
      };
    };
    quotation: {
      select: {
        id: true;
        quoteNo: true;
        quoteFy: true;
        status: true;
        createdAt: true;
      };
    };
    items: {
      orderBy: {
        sortOrder: "asc";
      };
      include: {
        product: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
        variant: {
          select: {
            id: true;
            variant: true;
            sku: true;
            typeNumber: true;
            drawings: true;
          };
        };
        ComponentsOfProductInSalesOrder: {
          orderBy: {
            sortOrder: "asc";
          };
        };
      };
    };
    poFile: true;
    deliveryChallans: {
      orderBy: {
        createdAt: "desc";
      };
      select: {
        id: true;
        challanNo: true;
        challanFy: true;
        createdAt: true;
      };
    };
    invoices: {
      orderBy: {
        createdAt: "desc";
      };
      select: {
        id: true;
        invoiceNo: true;
        invoiceFy: true;
        status: true;
        createdAt: true;
        grandTotal: true;
      };
    };
  };
}>;

// main nested types
export type SalesOrderCustomer = GetSalesOrderByIdData["customer"];
export type SalesOrderQuotation = GetSalesOrderByIdData["quotation"];
export type SalesOrderPoFile = GetSalesOrderByIdData["poFile"];
export type SalesOrderDeliveryChallan =
  GetSalesOrderByIdData["deliveryChallans"][number];
export type SalesOrderInvoice = GetSalesOrderByIdData["invoices"][number];
export type SalesOrderItem = GetSalesOrderByIdData["items"][number];

// nested item types
export type SalesOrderItemProduct = SalesOrderItem["product"];
export type SalesOrderItemVariant = SalesOrderItem["variant"];
export type SalesOrderItemComponent =
  SalesOrderItem["ComponentsOfProductInSalesOrder"][number];

// array helpers
export type SalesOrderItems = GetSalesOrderByIdData["items"];
export type SalesOrderDeliveryChallans =
  GetSalesOrderByIdData["deliveryChallans"];
export type SalesOrderInvoices = GetSalesOrderByIdData["invoices"];
export type SalesOrderItemComponents =
  SalesOrderItem["ComponentsOfProductInSalesOrder"];
