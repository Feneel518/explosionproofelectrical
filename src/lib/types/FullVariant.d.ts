import { ProductStatus } from "@prisma/client";

export type Variant = {
  id: string;
  cableEntry?: string | undefined | null;
  component: {
    id?: string | null;
    item?: string | undefined | null;
    unit?: string | undefined | null;
  }[];
  cutoutSize?: string | undefined | null;
  earthing?: string | undefined | null;
  gasket?: string | undefined | null;
  glass?: string | undefined | null;
  horsePower?: string | undefined | null;
  kW?: string | undefined | null;
  mounting?: string | undefined | null;
  plateSize?: string | undefined | null;
  productId: string | undefined | null;
  rpm?: string | undefined | null;
  size?: string | undefined | null;
  sku?: string | undefined | null;
  terminals?: string | undefined | null;
  typeNumber?: string | undefined | null;
  variant?: string;
  wireGuard?: string | undefined | null;
  rating?: string | undefined | null;
  status: ProductStatus;
  image: {
    id?: string | null;
    kind: ProductMediaKind;
    title?: string | undefined | null;
    url?: string | undefined | null;
  }[];
  drawings: {
    id?: string | null;
    kind: ProductMediaKind;
    title?: string | undefined | null;
    url?: string | undefined | null;
  }[];
};
