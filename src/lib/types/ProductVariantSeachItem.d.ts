export type ProductVariantSearchItem = {
  id: string; // variant id
  productId: string;

  productName: string;
  variantName: string | null;

  title: string; // display title
  sku: string | null;
  typeNumber: string | null;
  hardware: string | null;
  hsnCode: string | null;
  description: string | null;
  rating: string | null;
  terminals: string | null;
  gasket: string | null;
  mounting: string | null;
  cableEntry: string | null;
  earthing: string | null;
  cutoutSize: string | null;
  plateSize: string | null;
  glass: string | null;
  wireGuard: string | null;
  size: string | null;
  rpm: string | null;
  kW: string | null;
  horsePower: string | null;
  component: {
    id: string | null;
    item: string | null;
    unit: string | null;
  }[];

  images?: {
    id: string;
    url: string;
    alt?: string | null;
  }[];

  drawings?: {
    id: string;
    url: string;
    title?: string | null;
  }[];
};
