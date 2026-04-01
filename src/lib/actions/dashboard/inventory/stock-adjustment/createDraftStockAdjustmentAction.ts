"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { StockAdjustmentMovementType } from "@/lib/helpers/inventory/stockAdjustment";
import { prisma } from "@/lib/prisma/db";

export type StockAdjustmentItemType = "RAW_MATERIAL" | "FINISHED_GOOD";

export type StockAdjustmentDraftData = {
  header: {
    adjustDate?: string | null;
    adjustedByName?: string | null;
    reason?: string | null;
    remarks?: string | null;
  };
  items: Array<{
    id: string;
    itemType: StockAdjustmentItemType;
    rawMaterialId: string | null;
    productVariantId: string | null;
    title: string;
    supplierItemName?: string | null;
    sku?: string | null;
    typeNumber?: string | null;
    hsnCode?: string | null;
    unit?: string | null;
    movementType: StockAdjustmentMovementType;
    qty: number;
    unitCost?: number | null;
    remarks?: string | null;
    sortOrder: number;
  }>;
};

export async function createDraftStockAdjustmentAction() {
  const session = await requireAuth();
  const fy = getFinancialYearLabel(new Date());

  const counter = await prisma.fiscalCounter.upsert({
    where: { key: `STOCK_ADJUSTMENT:${fy}` },
    create: { key: `STOCK_ADJUSTMENT:${fy}`, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });

  const emptyDraft: StockAdjustmentDraftData = {
    header: {
      adjustDate: new Date().toISOString(),
      adjustedByName: session.user.name || session.user.email || "",
      reason: "",
      remarks: "",
    },
    items: [],
  };

  const created = await prisma.stockAdjustment.create({
    data: {
      adjustNo: counter.value,
      adjustFy: fy,
      status: "DRAFT",
      adjustedByNameSnapshot: "Draft",
      draftData: emptyDraft,
      draftVersion: 0,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true },
  });

  return { ok: true as const, id: created.id };
}
