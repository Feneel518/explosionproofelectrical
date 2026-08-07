"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { ProductVariantSearchItem } from "@/lib/types/ProductVariantSeachItem";
import type { Prisma } from "@prisma/client";

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

  // Users often know several fragments rather than the exact variant name,
  // e.g. "well glass 45w 4 terminal". Let each fragment match a different
  // product, variant, or component attribute while requiring every fragment.
  const terms = Array.from(
    new Set(q.split(/\s+/).map((term) => term.trim()).filter(Boolean)),
  ).slice(0, 10);

  const searchForTerm = (term: string): Prisma.ProductVariantWhereInput => ({
    OR: [
      { variant: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { typeNumber: { contains: term, mode: "insensitive" } },
      { rating: { contains: term, mode: "insensitive" } },
      { terminals: { contains: term, mode: "insensitive" } },
      { gasket: { contains: term, mode: "insensitive" } },
      { mounting: { contains: term, mode: "insensitive" } },
      { cableEntry: { contains: term, mode: "insensitive" } },
      { earthing: { contains: term, mode: "insensitive" } },
      { cutoutSize: { contains: term, mode: "insensitive" } },
      { plateSize: { contains: term, mode: "insensitive" } },
      { glass: { contains: term, mode: "insensitive" } },
      { wireGuard: { contains: term, mode: "insensitive" } },
      { size: { contains: term, mode: "insensitive" } },
      { rpm: { contains: term, mode: "insensitive" } },
      { kW: { contains: term, mode: "insensitive" } },
      { horsePower: { contains: term, mode: "insensitive" } },
      {
        product: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { slug: { contains: term, mode: "insensitive" } },
            { flpType: { contains: term, mode: "insensitive" } },
            { protection: { contains: term, mode: "insensitive" } },
            { gasGroup: { contains: term, mode: "insensitive" } },
            { material: { contains: term, mode: "insensitive" } },
            { finish: { contains: term, mode: "insensitive" } },
            { hardware: { contains: term, mode: "insensitive" } },
            { hsnCode: { contains: term, mode: "insensitive" } },
            { shortDesc: { contains: term, mode: "insensitive" } },
            { longDesc: { contains: term, mode: "insensitive" } },
            { category: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
      },
      {
        components: {
          some: {
            component: {
              item: { contains: term, mode: "insensitive" },
            },
          },
        },
      },
    ],
  });

  const rows = await prisma.productVariant.findMany({
    take: takeQty + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: {
      product: {
        deletedAt: null,
      },
      AND: terms.length > 0 ? terms.map(searchForTerm) : undefined,
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

  const hasMore = rows.length > takeQty;
  const sliced = hasMore ? rows.slice(0, takeQty) : rows;

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
