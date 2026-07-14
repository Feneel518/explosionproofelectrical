"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  CastingMasterSchema,
  CastingMasterSchemaRequest,
} from "@/lib/validators/dashboard/casting-masters/CastingMasterValidator";

export const updateCastingMasterAction = async (
  values: CastingMasterSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = CastingMasterSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  if (!data.id) {
    return {
      ok: false as const,
      message: "No casting master ID received.",
    };
  }

  try {
    const existing = await prisma.castingMaster.findUnique({
      where: { id: data.id },
      select: { id: true },
    });

    if (!existing) {
      return {
        ok: false as const,
        message: "Casting master not found.",
      };
    }

    await prisma.castingMaster.update({
      where: { id: data.id },
      data: {
        castingItemName: data.castingItemName.trim(),
        drawingNumber: data.drawingNumber?.trim() || null,
        hsnCode: data.hsnCode?.trim() || null,
        unit: data.unit.trim(),
        standardWeightKg:
          data.standardWeightKg == null ? null : Number(data.standardWeightKg),
        reorderLevel: data.reorderLevel ?? null,
        description: data.description?.trim() || null,
        status: data.status,
        updatedById: session.user.id,
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/casting-masters");
    revalidatePath(`/dashboard/casting-masters/${data.id}`);

    return {
      ok: true as const,
      message: "Casting master updated successfully.",
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to update casting master.");
  }
};
