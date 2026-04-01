"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { ProductVariantSearchItem } from "@/lib/types/ProductVariantSeachItem";

interface SearchProductVariantsForSelectArgs {
  query?: string;
  cursor?: string | null;
  take?: number;
}
export const searchProductVariantsForSelectAction = async ({
  cursor = null,
  query = "",
  take = 20,
}: SearchProductVariantsForSelectArgs): Promise<{
  items: ProductVariantSearchItem[];
  nextCursor: string | null;
}> => {
  await requireAuth();

  const q = (query ?? "").trim();

  const takeQty = Math.min(Math.max(take ?? 50, 5), 50);

  const rows = await prisma.productVariant.findMany({
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: {
      // adjust according to your schema
      product: {
        deletedAt: null,
      },
      OR: q
        ? [
            { variant: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { typeNumber: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      productId: true,
      variant: true,
      sku: true,
      typeNumber: true,
      rating: true,
      terminals: true,
      gasket: true,
      mounting: true,
      cableEntry: true,
      earthing: true,
      cutoutSize: true,
      plateSize: true,
      glass: true,
      wireGuard: true,
      size: true,
      rpm: true,
      kW: true,
      horsePower: true,
      product: {
        select: {
          name: true,
          hardware: true,
          hsnCode: true,
          shortDesc: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
          title: true,
        },
      },
      drawings: {
        select: {
          id: true,
          url: true,
          title: true,
        },
      },
      components: {
        select: {
          component: {
            select: {
              id: true,
              item: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;

  return {
    items: sliced.map((v) => ({
      id: v.id,
      description: v.product.shortDesc,
      hardware: v.product.hardware,
      hsnCode: v.product.hsnCode,
      productId: v.productId,
      productName: v.product.name,
      variantName: v.variant ?? null,
      title: [v.product.name, v.variant].filter(Boolean).join(" - "),
      sku: v.sku ?? null,
      typeNumber: v.typeNumber ?? null,
      rating: v.rating ?? null,
      terminals: v.terminals ?? null,
      gasket: v.gasket ?? null,
      mounting: v.mounting ?? null,
      cableEntry: v.cableEntry ?? null,
      earthing: v.earthing ?? null,
      cutoutSize: v.cutoutSize ?? null,
      plateSize: v.plateSize ?? null,
      glass: v.glass ?? null,
      wireGuard: v.wireGuard ?? null,
      size: v.size ?? null,
      rpm: v.rpm ?? null,
      kW: v.kW ?? null,
      horsePower: v.horsePower ?? null,
      images: v.images,
      drawings: v.drawings,
      component: v.components.map((comp) => {
        return {
          id: comp.component.id,
          item: comp.component.item,
          unit: comp.component.unit,
        };
      }),
    })),
    nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null,
  };
};
