"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function getRawMaterialIssueBalancesAction(
  rawMaterialIds: string[],
) {
  await requireAuth();

  const ids = Array.from(
    new Set(
      (rawMaterialIds ?? [])
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (ids.length === 0) {
    return { ok: true as const, balances: [] as Array<{ rawMaterialId: string; qtyOnHand: number }> };
  }

  const balances = await prisma.stockBalance.findMany({
    where: {
      rawMaterialId: {
        in: ids,
      },
    },
    select: {
      rawMaterialId: true,
      qtyOnHand: true,
    },
  });

  return {
    ok: true as const,
    balances: balances
      .filter((row): row is { rawMaterialId: string; qtyOnHand: number } => Boolean(row.rawMaterialId))
      .map((row) => ({
        rawMaterialId: row.rawMaterialId!,
        qtyOnHand: Number(row.qtyOnHand || 0),
      })),
  };
}
