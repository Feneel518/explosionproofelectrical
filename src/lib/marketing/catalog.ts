import type { ProductCardProduct } from "@/components/marketing/ProductCard";
import { prisma } from "@/lib/prisma/db";
import { marketingAsset } from "@/lib/marketing/data";

export type CatalogFilterOption = {
  label: string;
  value: string;
};

export type CatalogProductCard = ProductCardProduct & {
  filter: string;
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
};

const fallbackProductImages = [
  marketingAsset("wellglass.png"),
  marketingAsset("panel.png"),
  marketingAsset("flood.png"),
  marketingAsset("Tubeloight.png"),
  marketingAsset("flame.png"),
  marketingAsset("sketchfl.png"),
];

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
  variants: {
    typeNumber: string | null;
    images: {
      url: string;
    }[];
  }[];
};

export async function getCatalogData() {
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
    products: products.map((product, index) => toCatalogProductCard(product, index)),
  };
}

export async function getCatalogProductDetail(slug: string) {
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
    product: toCatalogProductDetail(product, 0),
    related: related.map((item, index) => toCatalogProductCard(item, index + 1)),
  };
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
      take: 1,
      select: {
        typeNumber: true,
        images: {
          orderBy: {
            sortOrder: "asc" as const,
          },
          take: 1,
          select: {
            url: true,
          },
        },
      },
    },
  } as const;
}

function toCatalogProductCard(
  product: CatalogProductRow,
  index: number,
): CatalogProductCard {
  const variant = product.variants[0];
  const image =
    variant?.images[0]?.url?.trim() ||
    fallbackProductImages[index % fallbackProductImages.length];

  return {
    slug: product.slug,
    name: product.name,
    cat: product.category.name,
    image,
    ip: formatProtectionLabel(product.protection) || "IP-66",
    group: formatGasGroupLabel(product.gasGroup) || "Ex d IIB",
    type: variant?.typeNumber?.trim() || product.flpType?.trim() || "EXEC",
    filter: product.category.slug,
  };
}

function toCatalogProductDetail(
  product: CatalogProductRow,
  index: number,
): CatalogProductDetail {
  return {
    ...toCatalogProductCard(product, index),
    categoryId: product.categoryId,
    categorySlug: product.category.slug,
    description:
      product.shortDesc?.trim() ||
      `The ${product.name} is a CIMFR tested, PESO approved ${product.category.name.toLowerCase()} unit engineered to contain an internal explosion and prevent ignition of the surrounding atmosphere.`,
    longDescription: product.longDesc,
    flpType: product.flpType,
    protection: product.protection,
    gasGroup: product.gasGroup,
    material: product.material,
    finish: product.finish,
    hardware: product.hardware,
    hsnCode: product.hsnCode,
    zones: product.zones ?? [],
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
