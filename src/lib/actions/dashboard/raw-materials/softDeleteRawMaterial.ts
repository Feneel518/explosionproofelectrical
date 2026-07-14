"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export const softDeleteRawMaterialAction = async (rawMaterialId: string) => {
  const session = await requireAuth();

  if (!rawMaterialId) {
    return {
      ok: false as const,
      message: "No raw material ID found to delete.",
    };
  }

  try {
    const exists = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId },
      select: { id: true },
    });

    if (!exists) {
      return {
        ok: false as const,
        message: "No raw material found in the database.",
      };
    }

    await prisma.rawMaterial.update({
      where: { id: rawMaterialId },
      data: { deletedAt: new Date(), deletedById: session.user.id },
    });

    revalidatePath("/dashboard/raw-materials");
    return { ok: true as const, message: "Raw material deleted successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to delete raw material.");
  }
};
