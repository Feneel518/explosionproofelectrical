"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export const restoreRawMaterialAction = async (rawMaterialId: string) => {
  const session = await requireAuth();

  if (!rawMaterialId) {
    return {
      ok: false as const,
      message: "No raw material ID found to restore.",
    };
  }

  try {
    const exists = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId },
      select: { id: true, deletedAt: true },
    });

    if (!exists) {
      return {
        ok: false as const,
        message: "No raw material found in the database.",
      };
    }

    if (exists.deletedAt === null) {
      return {
        ok: false as const,
        message: "Raw material is not deleted.",
      };
    }

    await prisma.rawMaterial.update({
      where: { id: rawMaterialId },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: session.user.id,
      },
    });

    revalidatePath("/dashboard/raw-materials");
    return { ok: true as const, message: "Raw material restored successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to restore raw material.");
  }
};
