"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function getStockAdjustmentBalancesAction({
  rawMaterialIds,
  productVariantIds,
}: {
  rawMaterialIds: string[];
  productVariantIds: string[];
}) {
  await requireAuth();

  const uniqueRawMaterialIds = Array.from(
    new Set((rawMaterialIds ?? []).filter(Boolean)),
  );
  const uniqueVariantIds = Array.from(
    new Set((productVariantIds ?? []).filter(Boolean)),
  );

  const rows =
    uniqueRawMaterialIds.length === 0 && uniqueVariantIds.length === 0
      ? []
      : await prisma.stockBalance.findMany({
          where: {
            OR: [
              uniqueRawMaterialIds.length > 0
                ? { rawMaterialId: { in: uniqueRawMaterialIds } }
                : undefined,
              uniqueVariantIds.length > 0
                ? { productVariantId: { in: uniqueVariantIds } }
                : undefined,
            ].filter(Boolean) as any,
          },
          select: {
            rawMaterialId: true,
            productVariantId: true,
            qtyOnHand: true,
          },
        });

  return {
    ok: true as const,
    balances: rows.map((row) => ({
      rawMaterialId: row.rawMaterialId,
      productVariantId: row.productVariantId,
      qtyOnHand: Number(row.qtyOnHand || 0),
    })),
  };
}
