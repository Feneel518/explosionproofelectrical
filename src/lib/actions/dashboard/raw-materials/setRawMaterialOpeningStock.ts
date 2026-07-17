"use server";

import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

type SetOpeningStockInput = {
  rawMaterialId: string;
  openingQty: number;
  openingUnitCost?: number | null;
  openingAt?: string | null;
};

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function setRawMaterialOpeningStockAction(
  input: SetOpeningStockInput,
) {
  const session = await requireInventoryAccess("MANAGE");

  if (!input.rawMaterialId) {
    return { ok: false as const, message: "Raw material ID is required." };
  }

  const openingQty = Number(Number(input.openingQty).toFixed(3));
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
    const material = await prisma.rawMaterial.findUnique({
      where: { id: input.rawMaterialId },
      select: {
        id: true,
        companyItemName: true,
        openingStockQty: true,
      },
    });

    if (!material) {
      return { ok: false as const, message: "Raw material not found." };
    }

    const previousOpeningQty = Number(material.openingStockQty ?? 0);
    const delta = openingQty - previousOpeningQty;

    await prisma.$transaction(async (tx) => {
      if (delta !== 0) {
        await postStockMovement(tx, {
          rawMaterialId: input.rawMaterialId,
          movementType: delta > 0 ? "ADJUST_IN" : "ADJUST_OUT",
          referenceType: "MANUAL_ADJUSTMENT",
          referenceId: input.rawMaterialId,
          referenceNo: "OPENING-STOCK",
          qty: Math.abs(delta),
          unitCost: openingUnitCost,
          movementDate: openingAt,
          actorName: session.user.email || null,
          remarks: `Opening stock updated for ${material.companyItemName} from ${previousOpeningQty} to ${openingQty}`,
          createdById: session.user.id,
        });
      }

      await tx.rawMaterial.update({
        where: { id: input.rawMaterialId },
        data: {
          openingStockQty: openingQty,
          openingStockUnitCost: openingUnitCost,
          openingStockAt: openingAt,
          inventoryActivatedAt: openingAt,
          inventoryActivationSource: "OPENING_COUNT",
          updatedById: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/raw-materials");
    revalidatePath(`/dashboard/raw-materials/${input.rawMaterialId}`);
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");
    revalidatePath("/dashboard/inventory/go-live");

    return {
      ok: true as const,
      message:
        delta === 0
          ? "Opening stock details updated."
          : `Opening stock updated successfully (delta ${delta > 0 ? "+" : ""}${delta} added to in-hand).`,
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to set opening stock.");
  }
}
