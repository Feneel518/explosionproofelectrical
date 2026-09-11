import type { ProductCardProduct } from "@/components/marketing/ProductCard";
import { prisma } from "@/lib/prisma/db";
import { cache } from "react";

export type CatalogFilterOption = {
  label: string;
  value: string;
};

export type CatalogProductCard = ProductCardProduct & {
  filter: string;
  description: string;
  variantCount: number;
  searchText: string;
};

export type CatalogProductDetail = CatalogProductCard & {
  categoryId: string;
  categorySlug: string;
  description: string;
  longDescription?: string | null;
  flpType?: string | null;
  protection?: string | null;
  gasGroup?: string | null;
  material?: string | null;
  finish?: string | null;
  hardware?: string | null;
  hsnCode?: string | null;
  zones: string[];
  variants: CatalogVariant[];
};

export type CatalogVariant = {
  id: string;
  variant: string;
  typeNumber: string | null;
  sku: string | null;
  images: { url: string; title: string | null }[];
  drawings: { url: string; title: string | null }[];
  specs: [string, string][];
};

const variantFields = {
  rating: "Rating", terminals: "Terminals", gasket: "Gasket", mounting: "Mounting",
  cableEntry: "Cable entry", earthing: "Earthing", cutoutSize: "Cutout size",
  plateSize: "Plate size", size: "Size", glass: "Glass", wireGuard: "Wire guard",
  rpm: "RPM", kW: "kW", horsePower: "Horsepower",
} as const;

type CatalogProductRow = {
  name: string;
  slug: string;
  flpType: string | null;
  protection: string | null;
  gasGroup: string | null;
  material?: string | null;
  finish?: string | null;
  hardware?: string | null;
  hsnCode?: string | null;
  zones?: string[];
  shortDesc?: string | null;
  longDesc?: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: (Omit<CatalogVariant, "specs"> & Partial<Record<keyof typeof variantFields, string | null>>)[];
};

export const getCatalogData = cache(async () => {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
        slug: true,
      },
    }),
    prisma.product.findMany({
      where: activeCatalogProductWhere(),
      orderBy: {
        createdAt: "asc",
      },
      select: catalogProductSelect(),
    }),
  ]);

  return {
    filters: [
      { label: "All", value: "all" },
      ...categories.map((category) => ({
        label: category.name,
        value: category.slug,
      })),
    ],
    products: products.map(toCatalogProductCard),
  };
});

export const getCatalogProductDetail = cache(async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      ...activeCatalogProductWhere(),
      slug,
    },
    select: catalogProductSelect(),
  });

  if (!product) return null;

  const related = await prisma.product.findMany({
    where: {
      ...activeCatalogProductWhere(),
      categoryId: product.categoryId,
      slug: {
        not: product.slug,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 3,
    select: catalogProductSelect(),
  });

  return {
    product: toCatalogProductDetail(product),
    related: related.map(toCatalogProductCard),
  };
});

/** The PDF uses exactly the same publication rules and fields as the website. */
export async function getCatalogPdfProducts(): Promise<CatalogProductDetail[]> {
  if (process.env.CATALOG_PDF_TRANSPORT === "neon-http") {
    const { readCatalogOverNeonHttp } = await import("./catalogNeonHttp");
    return readCatalogOverNeonHttp();
  }
  const products = await prisma.product.findMany({
    where: activeCatalogProductWhere(),
    orderBy: [{ category: { name: "asc" } }, { createdAt: "asc" }],
    select: catalogProductSelect(),
  });
  return products.map(toCatalogProductDetail);
}

function activeCatalogProductWhere() {
  return {
    status: "ACTIVE" as const,
    deletedAt: null,
    category: {
      status: "ACTIVE" as const,
      deletedAt: null,
    },
  };
}

function catalogProductSelect() {
  return {
    name: true,
    slug: true,
    flpType: true,
    protection: true,
    gasGroup: true,
    material: true,
    finish: true,
    hardware: true,
    hsnCode: true,
    zones: true,
    shortDesc: true,
    longDesc: true,
    categoryId: true,
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    variants: {
      where: {
        status: "ACTIVE" as const,
      },
      orderBy: {
        createdAt: "asc" as const,
      },
      select: {
        id: true, variant: true, sku: true,
        rating: true, terminals: true, gasket: true, mounting: true,
        cableEntry: true, earthing: true, cutoutSize: true, plateSize: true,
        size: true, glass: true, wireGuard: true, rpm: true, kW: true, horsePower: true,
        drawings: { orderBy: { sortOrder: "asc" as const }, select: { url: true, title: true } },
        typeNumber: true,
        images: {
          orderBy: {
            sortOrder: "asc" as const,
          },
          select: {
            url: true,
            title: true,
          },
        },
      },
    },
  } as const;
}

function toCatalogProductCard(
  product: CatalogProductRow,
): CatalogProductCard {
  const variant = product.variants[0];
  const image = product.variants.flatMap((item) => item.images).find((item) => item.url.trim())?.url || "";

  return {
    slug: product.slug,
    name: product.name,
    cat: product.category.name,
    image,
    ip: formatProtectionLabel(product.protection) || "",
    group: formatGasGroupLabel(product.gasGroup) || "",
    type: variant?.typeNumber?.trim() || product.flpType?.trim() || "EXEC",
    filter: product.category.slug,
    description: product.shortDesc?.trim() || `Explore ${product.name.toLowerCase()} from our ${product.category.name.toLowerCase()} range.`,
    variantCount: product.variants.length,
    searchText: product.variants.map((item) => [item.variant, item.typeNumber, item.sku, item.rating].filter(Boolean).join(" ")).join(" "),
  };
}

export function toCatalogProductDetail(
  product: CatalogProductRow,
): CatalogProductDetail {
  return {
    ...toCatalogProductCard(product),
    categoryId: product.categoryId,
    categorySlug: product.category.slug,
    description:
      product.shortDesc?.trim() ||
      `Explore ${product.name.toLowerCase()} from our ${product.category.name.toLowerCase()} range. Speak with our team about your application and specification.`,
    longDescription: product.longDesc,
    flpType: product.flpType,
    protection: product.protection,
    gasGroup: product.gasGroup,
    material: product.material,
    finish: product.finish,
    hardware: product.hardware,
    hsnCode: product.hsnCode,
    zones: product.zones ?? [],
    variants: product.variants.map((variant) => ({
      id: variant.id, variant: variant.variant, typeNumber: variant.typeNumber,
      sku: variant.sku, images: variant.images, drawings: variant.drawings,
      specs: Object.entries(variantFields).flatMap(([key, label]): [string, string][] => {
        const value = variant[key as keyof typeof variantFields]?.trim();
        return value ? [[label, value]] : [];
      }),
    })),
  };
}

export function formatProtectionLabel(protection?: string | null) {
  return protection?.match(/IP[-\s]?\d+/i)?.[0]?.replace(/\s+/, "-").toUpperCase();
}

export function formatGasGroupLabel(gasGroup?: string | null) {
  const gasGroups = Array.from(new Set(gasGroup?.match(/II[ABC]/gi) ?? []))
    .map((group) => group.toUpperCase())
    .join("/");

  return gasGroups ? `Ex d ${gasGroups}` : undefined;
}
