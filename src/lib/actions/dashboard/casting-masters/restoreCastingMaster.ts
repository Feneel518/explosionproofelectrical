"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";

export const restoreCastingMasterAction = async (castingMasterId: string) => {
  const session = await requireAuth();

  if (!castingMasterId) {
    return {
      ok: false as const,
      message: "No casting master ID found to restore.",
    };
  }

  try {
    const exists = await prisma.castingMaster.findUnique({
      where: { id: castingMasterId },
      select: { id: true, deletedAt: true },
    });

    if (!exists) {
      return {
        ok: false as const,
        message: "No casting master found in the database.",
      };
    }

    if (exists.deletedAt === null) {
      return {
        ok: false as const,
        message: "Casting master is not deleted.",
      };
    }

    await prisma.castingMaster.update({
      where: { id: castingMasterId },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: session.user.id,
      },
    });

    revalidatePath("/dashboard/casting-masters");
    return { ok: true as const, message: "Casting master restored successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to restore casting master.");
  }
};
