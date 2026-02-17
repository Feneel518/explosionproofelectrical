"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const restoreCustomerAction = async (customerId: string) => {
  const session = await requireAuth();

  if (!customerId) {
    return {
      ok: false,
      message: "No customer Id found to delete.",
    };
  }

  try {
    const exists = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: { id: true, deletedAt: true },
    });

    if (!exists) {
      return {
        ok: false,
        message: "No customer found in the database.",
      };
    }
    if (!exists.deletedAt === null) {
      return {
        ok: false,
        message: "The customer is not deleted to be restored.",
      };
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: session.user.id,
      },
    });

    revalidatePath("/dashboard/customers");
    return { ok: true, message: "Customer Restored successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to restore customer.");
  }
};
