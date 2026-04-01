"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const softDeleteSupplierAction = async (supplierId: string) => {
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
      select: { id: true },
    });

    if (!exists) {
      return {
        ok: false,
        message: "No supplier found in the database.",
      };
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: { deletedAt: new Date(), deletedById: session.user.id },
    });

    revalidatePath("/dashboard/suppliers");
    return { ok: true, message: "Supplier deleted successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to delete supplier.");
  }
};

