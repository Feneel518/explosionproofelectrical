"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export async function getRawMaterialIssueBalancesAction(
  rawMaterialIds: string[],
) {
  await requirePermission("inventory.read");

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
    balances: balances.flatMap((row) =>
      row.rawMaterialId
        ? [{ rawMaterialId: row.rawMaterialId, qtyOnHand: Number(row.qtyOnHand || 0) }]
        : [],
    ),
  };
}
