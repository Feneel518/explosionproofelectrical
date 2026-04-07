"use server";

import { StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";

type AdjustRawMaterialStockInput = {
  rawMaterialId: string;
  movementType: StockMovementType;
  qty: number;
  reason?: string | null;
  remarks?: string | null;
  movementAt?: string | null;
};

const ALLOWED_MOVEMENTS = new Set<StockMovementType>([
  "ADJUST_IN",
  "ADJUST_OUT",
  "SCRAP_OUT",
  "RETURN_IN",
  "RETURN_OUT",
]);

function trimOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function adjustRawMaterialStockAction(
  input: AdjustRawMaterialStockInput,
) {
  const session = await requireAuth();

  if (!input.rawMaterialId) {
    return { ok: false as const, message: "Raw material ID is required." };
  }

  const qty = Math.trunc(Number(input.qty));
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false as const, message: "Adjustment quantity must be greater than 0." };
  }

  if (!ALLOWED_MOVEMENTS.has(input.movementType)) {
    return { ok: false as const, message: "Invalid adjustment type." };
  }

  const reason = trimOrNull(input.reason) ?? "Manual adjustment";
  const movementAt = toDateOrNull(input.movementAt) ?? new Date();

  try {
    const material = await prisma.rawMaterial.findUnique({
      where: { id: input.rawMaterialId },
      select: { id: true, companyItemName: true },
    });

    if (!material) {
      return { ok: false as const, message: "Raw material not found." };
    }

    const movementLabel =
      input.movementType === "SCRAP_OUT"
        ? "Rejection/Scrap"
        : input.movementType.replaceAll("_", " ");
    const fullRemarks = [reason, trimOrNull(input.remarks)].filter(Boolean).join(" | ");

    await prisma.$transaction(async (tx) => {
      await postStockMovement(tx, {
        rawMaterialId: material.id,
        movementType: input.movementType,
        referenceType: "MANUAL_ADJUSTMENT",
        referenceId: crypto.randomUUID(),
        referenceNo: "RM-ADJUST",
        qty,
        movementDate: movementAt,
        actorName: session.user.name || session.user.email || "System",
        remarks: fullRemarks || "Manual stock adjustment",
        createdById: session.user.id,
      });
    });

    revalidatePath("/dashboard/raw-materials");
    revalidatePath(`/dashboard/raw-materials/${material.id}`);
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");

    return {
      ok: true as const,
      message: `${movementLabel} posted for ${material.companyItemName} (${qty}).`,
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to adjust raw material stock.");
  }
}

