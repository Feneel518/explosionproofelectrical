"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

export async function getStockAdjustmentByIdAction(id: string) {
  await requireAuth();

  const stockAdjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!stockAdjustment) {
    return { ok: false as const, message: "Stock adjustment not found." };
  }

  return {
    ok: true as const,
    stockAdjustment: serializeForClient(stockAdjustment),
  };
}
