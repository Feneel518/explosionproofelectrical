"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { StockAdjustmentDraftData } from "./createDraftStockAdjustmentAction";

export async function getStockAdjustmentDraftAction(id: string) {
  await requireAuth();

  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      adjustNo: true,
      adjustFy: true,
      draftData: true,
      draftVersion: true,
    },
  });

  if (!adjustment) {
    return { ok: false as const, message: "Stock adjustment not found." };
  }

  if (adjustment.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Stock adjustment is finalized and cannot be edited.",
    };
  }

  const draft = (adjustment.draftData ?? {
    header: {
      adjustDate: new Date().toISOString(),
      adjustedByName: "",
      reason: "",
      remarks: "",
    },
    items: [],
  }) as StockAdjustmentDraftData;

  return {
    ok: true as const,
    stockAdjustmentId: adjustment.id,
    adjustNo: adjustment.adjustNo,
    adjustFy: adjustment.adjustFy,
    draft,
    draftVersion: adjustment.draftVersion,
  };
}
