"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export const restoreCategoryyAction = async (id: string) => {
  const session = await requireAuth();

  if (!id) {
    return {
      ok: false,
      message: "No category Id found to delete.",
    };
  }

  try {
    const exists = await prisma.category.findUnique({
      where: {
        id,
      },
      select: { id: true, deletedAt: true },
    });

    if (!exists) {
      return {
        ok: false,
        message: "No category found in the database.",
      };
    }
    if (!exists.deletedAt === null) {
      return {
        ok: false,
        message: "The category is not deleted to be restored.",
      };
    }

    await prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: session.user.id,
      },
    });

    revalidatePath("/dashboard/categories");
    return { ok: true, message: "Category Restored successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to restore Category.");
  }
};
