"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { StockAdjustmentDraftData } from "./createDraftStockAdjustmentAction";

export async function saveStockAdjustmentDraftSnapshotAction({
  stockAdjustmentId,
  draft,
  clientVersion,
}: {
  stockAdjustmentId: string;
  draft: StockAdjustmentDraftData;
  clientVersion: number;
}) {
  const session = await requireAuth();

  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: stockAdjustmentId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!adjustment) {
    return { ok: false as const, message: "Stock adjustment not found." };
  }

  if (adjustment.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Only draft stock adjustment can be saved.",
    };
  }

  if (clientVersion !== adjustment.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: adjustment.draftVersion,
    };
  }

  const updated = await prisma.stockAdjustment.update({
    where: { id: stockAdjustmentId },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  });

  return {
    ok: true as const,
    serverVersion: updated.draftVersion,
    savedAt: updated.updatedAt.toISOString(),
  };
}
