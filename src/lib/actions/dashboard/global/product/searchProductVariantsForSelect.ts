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

  const variantWhere: Prisma.ProductVariantWhereInput = {
    product: {
      deletedAt: null,
    },
    AND: terms.length > 0 ? terms.map(searchForTerm) : undefined,
  };

  // Rank matching variants by the total quantity on real sales orders. Draft
  // and cancelled orders are excluded so incomplete data does not affect the
  // suggestions. Updated time and id provide stable tie-breakers.
  const candidates = await prisma.productVariant.findMany({
    where: variantWhere,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const candidateIds = candidates.map((variant) => variant.id);
  const usageRows = candidateIds.length
    ? await prisma.salesOrderItem.groupBy({
        by: ["variantId"],
        where: {
          variantId: { in: candidateIds },
          salesOrder: {
            deletedAt: null,
            status: { notIn: ["DRAFT", "CANCELLED"] },
          },
        },
        _sum: { qty: true },
      })
    : [];

  const usedQtyByVariant = new Map(
    usageRows.flatMap((row) =>
      row.variantId ? [[row.variantId, row._sum.qty ?? 0] as const] : [],
    ),
  );

  candidates.sort((a, b) => {
    const qtyDifference =
      (usedQtyByVariant.get(b.id) ?? 0) -
      (usedQtyByVariant.get(a.id) ?? 0);

    if (qtyDifference !== 0) return qtyDifference;

    const updatedDifference = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (updatedDifference !== 0) return updatedDifference;

    return b.id.localeCompare(a.id);
  });

  const cursorIndex = cursor
    ? candidates.findIndex((variant) => variant.id === cursor)
    : -1;
  const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  const pageCandidates = candidates.slice(startIndex, startIndex + takeQty + 1);
  const hasMore = pageCandidates.length > takeQty;
  const pageIds = pageCandidates
    .slice(0, takeQty)
    .map((variant) => variant.id);

  const unorderedRows = await prisma.productVariant.findMany({
    where: {
      id: { in: pageIds },
    },
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

  const rowById = new Map(unorderedRows.map((row) => [row.id, row]));
  const rows = pageIds.flatMap((id) => {
    const row = rowById.get(id);
    return row ? [row] : [];
  });

  return {
    items: rows.map((v) => ({
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
    nextCursor: hasMore ? (pageIds[pageIds.length - 1] ?? null) : null,
  };
};
