"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const restoreSupplierAction = async (supplierId: string) => {
  const session = await requireAuth();

  if (!supplierId) {
    return {
      ok: false,
      message: "No supplier Id found to delete.",
    };
  }

  try {
    const exists = await prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
      select: { id: true, deletedAt: true },
    });

    if (!exists) {
      return {
        ok: false,
        message: "No supplier found in the database.",
      };
    }
    if (!exists.deletedAt === null) {
      return {
        ok: false,
        message: "The supplier is not deleted to be restored.",
      };
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: session.user.id,
      },
    });

    revalidatePath("/dashboard/suppliers");
    return { ok: true, message: "Supplier Restored successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to restore supplier.");
  }
};
