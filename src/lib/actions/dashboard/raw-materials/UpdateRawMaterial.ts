"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  RawMaterialSchema,
  RawMaterialSchemaRequest,
} from "@/lib/validators/dashboard/raw-materials/RawMaterialValidator";
import { revalidatePath } from "next/cache";

export const updateRawMaterialAction = async (
  values: RawMaterialSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = RawMaterialSchema.safeParse(values);

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
      message: "No raw material ID received.",
    };
  }

  try {
    const existing = await prisma.rawMaterial.findUnique({
      where: { id: data.id },
      select: { id: true },
    });

    if (!existing) {
      return {
        ok: false as const,
        message: "Raw material not found.",
      };
    }

    const response = await prisma.rawMaterial.update({
      where: { id: data.id },
      data: {
        companyItemName: data.companyItemName.trim(),
        supplierItemName: data.supplierItemName?.trim() || null,
        hsnCode: data.hsnCode?.trim() || null,
        unit: data.unit.trim(),
        description: data.description?.trim() || null,
        reorderLevel: data.reorderLevel ?? null,
        preferredSupplierId: data.preferredSupplierId || null,
        status: data.status,
        updatedById: session.user.id,
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/raw-materials");
    revalidatePath(`/dashboard/raw-materials/${response.id}`);

    return {
      ok: true as const,
      message: "Raw material updated successfully.",
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to update raw material.");
  }
};
