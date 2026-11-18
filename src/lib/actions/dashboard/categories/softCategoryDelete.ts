"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const softDeleteCategoryAction = async (id: string) => {
  const session = await requirePermission("master.write");

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
      select: { id: true },
    });

    if (!exists) {
      return {
        ok: false,
        message: "No catgeory found in the database.",
      };
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: session.user.id },
    });

    revalidatePath("/dashboard/categories");
    return { ok: true, message: "Category deleted successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to delete Category.");
  }
};
