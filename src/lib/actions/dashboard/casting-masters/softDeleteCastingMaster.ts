"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/check/permissions";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";

export const softDeleteCastingMasterAction = async (castingMasterId: string) => {
  const session = await requirePermission("master.write");

  if (!castingMasterId) {
    return {
      ok: false as const,
      message: "No casting master ID found to delete.",
    };
  }

  try {
    const exists = await prisma.castingMaster.findUnique({
      where: { id: castingMasterId },
      select: { id: true },
    });

    if (!exists) {
      return {
        ok: false as const,
        message: "No casting master found in the database.",
      };
    }

    await prisma.castingMaster.update({
      where: { id: castingMasterId },
      data: { deletedAt: new Date(), deletedById: session.user.id },
    });

    revalidatePath("/dashboard/casting-masters");
    return { ok: true as const, message: "Casting master deleted successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to delete casting master.");
  }
};
