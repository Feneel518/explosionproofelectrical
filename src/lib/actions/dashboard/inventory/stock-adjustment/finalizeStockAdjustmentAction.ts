"use server";

import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import {
  isStockAdjustmentMovementType,
  StockAdjustmentMovementType,
} from "@/lib/helpers/inventory/stockAdjustment";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { revalidatePath } from "next/cache";
import {
  StockAdjustmentDraftData,
  StockAdjustmentItemType,
} from "./createDraftStockAdjustmentAction";

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function trimOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeItemType(value: string | null | undefined): StockAdjustmentItemType {
  return value === "FINISHED_GOOD" ? "FINISHED_GOOD" : "RAW_MATERIAL";
}

export async function finalizeStockAdjustmentAction(id: string) {
  const session = await requireInventoryAccess("MANAGE");

  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      adjustNo: true,
      adjustFy: true,
      draftData: true,
    },
  });

  if (!adjustment) {
    return { ok: false as const, message: "Stock adjustment not found." };
  }

  if (adjustment.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Only draft stock adjustment can be finalized.",
    };
  }

  const draft = adjustment.draftData as StockAdjustmentDraftData | null;
  if (!draft) {
    return { ok: false as const, message: "Draft data missing." };
  }

  if (!draft.items?.length) {
    return { ok: false as const, message: "Add at least one item." };
  }

  const preparedItems = draft.items.map((item, index) => {
    const itemType = normalizeItemType(item.itemType);
    const qty = Number(toNumber(item.qty, 0).toFixed(3));

    const rawMaterialId = itemType === "RAW_MATERIAL" ? item.rawMaterialId : null;
    const productVariantId =
      itemType === "FINISHED_GOOD" ? item.productVariantId : null;

    if (qty <= 0) {
      throw new Error(`Quantity must be greater than 0 at row ${index + 1}.`);
    }

    if (itemType === "RAW_MATERIAL" && !rawMaterialId) {
      throw new Error(`Select a raw material at row ${index + 1}.`);
    }

    if (itemType === "FINISHED_GOOD" && !productVariantId) {
      throw new Error(`Select a finished good at row ${index + 1}.`);
    }

    if (!isStockAdjustmentMovementType(item.movementType)) {
      throw new Error(`Invalid movement type at row ${index + 1}.`);
    }

    let unitCost: number | null = null;
    if (item.unitCost != null && item.unitCost !== ("" as any)) {
      const parsed = Number(item.unitCost);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid unit cost at row ${index + 1}.`);
      }
      unitCost = parsed;
    }

    return {
      id: item.id || crypto.randomUUID(),
      itemType,
      rawMaterialId,
      productVariantId,
      title: item.title?.trim() || "Item",
      supplierItemName: trimOrNull(item.supplierItemName),
      sku: trimOrNull(item.sku),
      typeNumber: trimOrNull(item.typeNumber),
      hsnCode: trimOrNull(item.hsnCode),
      unit: trimOrNull(item.unit) ?? "Nos",
      movementType: item.movementType as StockAdjustmentMovementType,
      qty,
      unitCost,
      remarks: trimOrNull(item.remarks),
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    };
  });

  const rawMaterialIds = Array.from(
    new Set(
      preparedItems
        .map((item) => item.rawMaterialId)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const productVariantIds = Array.from(
    new Set(
      preparedItems
        .map((item) => item.productVariantId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (rawMaterialIds.length > 0) {
    const existingRawMaterials = await prisma.rawMaterial.findMany({
      where: { id: { in: rawMaterialIds } },
      select: { id: true },
    });

    if (existingRawMaterials.length !== rawMaterialIds.length) {
      return {
        ok: false as const,
        message: "One or more selected raw materials do not exist.",
      };
    }
  }

  if (productVariantIds.length > 0) {
    const existingVariants = await prisma.productVariant.findMany({
      where: { id: { in: productVariantIds } },
      select: { id: true },
    });

    if (existingVariants.length !== productVariantIds.length) {
      return {
        ok: false as const,
        message: "One or more selected finished goods do not exist.",
      };
    }
  }

  const adjustDate = toDateOrNull(draft.header.adjustDate) ?? new Date();
  const adjustedByName =
    trimOrNull(draft.header.adjustedByName) ||
    session.user.name ||
    session.user.email ||
    "System";
  const headerReason = trimOrNull(draft.header.reason);
  const headerRemarks = trimOrNull(draft.header.remarks);

  if (!headerReason) {
    return { ok: false as const, message: "Adjustment reason is required." };
  }

  const documentNo = formatFinancialDocumentNumber(
    adjustment.adjustFy,
    adjustment.adjustNo,
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stockAdjustment.update({
        where: { id: adjustment.id },
        data: {
          status: "FINALIZED",
          adjustDate,
          adjustedByNameSnapshot: adjustedByName,
          reason: headerReason,
          remarks: headerRemarks,
          finalizedAt: new Date(),
          finalizedById: session.user.id,
          updatedById: session.user.id,
        },
      });

      await tx.stockAdjustmentItem.deleteMany({
        where: { stockAdjustmentId: adjustment.id },
      });

      for (const item of preparedItems) {
        await tx.stockAdjustmentItem.create({
          data: {
            id: item.id,
            stockAdjustmentId: adjustment.id,
            rawMaterialId: item.rawMaterialId,
            productVariantId: item.productVariantId,
            title: item.title,
            supplierItemName: item.supplierItemName,
            sku: item.sku,
            typeNumber: item.typeNumber,
            hsnCode: item.hsnCode,
            unit: item.unit,
            movementType: item.movementType,
            qty: item.qty,
            unitCost: item.unitCost,
            remarks: item.remarks,
            sortOrder: item.sortOrder,
          },
        });

        const rowRemarks = [
          headerReason ? `Reason: ${headerReason}` : null,
          item.remarks,
        ]
          .filter(Boolean)
          .join(" | ");

        await postStockMovement(tx, {
          rawMaterialId: item.rawMaterialId,
          productVariantId: item.productVariantId,
          movementType: item.movementType,
          referenceType: "MANUAL_ADJUSTMENT",
          referenceId: adjustment.id,
          referenceNo: documentNo,
          qty: item.qty,
          unitCost: item.unitCost,
          movementDate: adjustDate,
          actorName: adjustedByName,
          remarks: rowRemarks || "Stock adjustment posted",
          createdById: session.user.id,
        });
      }
    }, FINALIZE_TRANSACTION_OPTIONS);
  } catch (error: any) {
    return {
      ok: false as const,
      message: error?.message || "Failed to finalize stock adjustment.",
    };
  }

  revalidatePath("/dashboard/inventory/adjustments");
  revalidatePath(`/dashboard/inventory/adjustments/${id}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");

  return {
    ok: true as const,
    message: "Stock adjustment finalized successfully.",
  };
}
