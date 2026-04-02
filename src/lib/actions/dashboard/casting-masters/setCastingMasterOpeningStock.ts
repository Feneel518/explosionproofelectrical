"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";

type SetOpeningStockInput = {
  castingMasterId: string;
  openingQty: number;
  openingUnitCost?: number | null;
  openingAt?: string | null;
};

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function setCastingMasterOpeningStockAction(
  input: SetOpeningStockInput,
) {
  const session = await requireAuth();

  if (!input.castingMasterId) {
    return { ok: false as const, message: "Casting master ID is required." };
  }

  const openingQty = Math.trunc(Number(input.openingQty));
  if (!Number.isFinite(openingQty) || openingQty < 0) {
    return { ok: false as const, message: "Opening quantity must be 0 or greater." };
  }

  let openingUnitCost: number | null = null;
  if (input.openingUnitCost != null && input.openingUnitCost !== ("" as any)) {
    const parsed = Number(input.openingUnitCost);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false as const, message: "Opening unit cost must be 0 or greater." };
    }
    openingUnitCost = parsed;
  }

  const openingAt = toDateOrNull(input.openingAt) ?? new Date();

  try {
    const casting = await prisma.castingMaster.findUnique({
      where: { id: input.castingMasterId },
      select: {
        id: true,
        castingItemName: true,
      },
    });

    if (!casting) {
      return { ok: false as const, message: "Casting master not found." };
    }

    const currentBalance = await prisma.stockBalance.findFirst({
      where: { castingMasterId: input.castingMasterId },
      select: { qtyOnHand: true },
    });

    const currentOnHand = currentBalance?.qtyOnHand ?? 0;
    const delta = openingQty - currentOnHand;

    await prisma.$transaction(async (tx) => {
      if (delta !== 0) {
        await postStockMovement(tx, {
          castingMasterId: input.castingMasterId,
          movementType: delta > 0 ? "ADJUST_IN" : "ADJUST_OUT",
          referenceType: "MANUAL_ADJUSTMENT",
          referenceId: input.castingMasterId,
          referenceNo: "OPENING-STOCK",
          qty: Math.abs(delta),
          unitCost: openingUnitCost,
          movementDate: openingAt,
          actorName: session.user.email || null,
          remarks: `Opening stock set for ${casting.castingItemName} from ${currentOnHand} to ${openingQty}`,
          createdById: session.user.id,
        });
      }

      await tx.castingMaster.update({
        where: { id: input.castingMasterId },
        data: {
          openingStockQty: openingQty,
          openingStockUnitCost: openingUnitCost,
          openingStockAt: openingAt,
          updatedById: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/casting-masters");
    revalidatePath(`/dashboard/casting-masters/${input.castingMasterId}`);
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");

    return {
      ok: true as const,
      message:
        delta === 0
          ? "Opening stock details updated."
          : `Opening stock set successfully (adjusted ${delta > 0 ? "+" : ""}${delta}).`,
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to set opening stock.");
  }
}
