"use server";

import { StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";

type AdjustCastingMasterStockInput = {
  castingMasterId: string;
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

export async function adjustCastingMasterStockAction(
  input: AdjustCastingMasterStockInput,
) {
  const session = await requireAuth();

  if (!input.castingMasterId) {
    return { ok: false as const, message: "Casting master ID is required." };
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
    const casting = await prisma.castingMaster.findUnique({
      where: { id: input.castingMasterId },
      select: { id: true, castingItemName: true },
    });

    if (!casting) {
      return { ok: false as const, message: "Casting master not found." };
    }

    const movementLabel =
      input.movementType === "SCRAP_OUT"
        ? "Rejection/Scrap"
        : input.movementType.replaceAll("_", " ");
    const fullRemarks = [reason, trimOrNull(input.remarks)].filter(Boolean).join(" | ");

    await prisma.$transaction(async (tx) => {
      await postStockMovement(tx, {
        castingMasterId: casting.id,
        movementType: input.movementType,
        referenceType: "MANUAL_ADJUSTMENT",
        referenceId: crypto.randomUUID(),
        referenceNo: "CM-ADJUST",
        qty,
        movementDate: movementAt,
        actorName: session.user.name || session.user.email || "System",
        remarks: fullRemarks || "Manual stock adjustment",
        createdById: session.user.id,
      });
    });

    revalidatePath("/dashboard/casting-masters");
    revalidatePath(`/dashboard/casting-masters/${casting.id}`);
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");

    return {
      ok: true as const,
      message: `${movementLabel} posted for ${casting.castingItemName} (${qty}).`,
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to adjust casting stock.");
  }
}

