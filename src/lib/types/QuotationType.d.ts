export type QuotationDraftHeader = {
  platform?: any;
  customerId?: string | null;
  clientName?: string | null;

  receivedFromName?: string | null;
  receivedFromPhone?: string | null;
  receivedFromEmail?: string | null;
  enquiryMessage?: string | null;

  additionalNotes?: string | null;
  deliveryDate?: string | null;
  nextFollowupAt?: Date | null;

  gst?: any;
  packingCharges?: any;
  paymentTerms?: any;
  transportationPayment?: any;
  discount?: string | null;
};

export type QuotationDraftItem = {
  id: string; // client UUID

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

  component?: {
    id?: string | null;
    item?: string | null;
    unit?: string | null;
  }[];
  qty: number;
  unit?: string | null;
  unitPrice: string; // decimal as string
  sortOrder: number;

  showVariantImages?: boolean;
  showVariantDrawings?: boolean;

  selectedVariantImageIds?: string[];
  selectedVariantDrawingIds?: string[];

  variantImagesSnapshot?: {
    id: string;
    url: string;
    title?: string | null;
  }[];

  variantDrawingsSnapshot?: {
    id: string;
    url: string;
    title?: string | null;
  }[];
};

export type QuotationDraftData = {
  header: QuotationDraftHeader;
  items: QuotationDraftItem[];
};
