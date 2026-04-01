"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const softDeleteCustomerAction = async (customerId: string) => {
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
      select: { id: true },
    });

    if (!exists) {
      return {
        ok: false,
        message: "No customer found in the database.",
      };
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { deletedAt: new Date(), deletedById: session.user.id },
    });

    revalidatePath("/dashboard/customers");
    return { ok: true, message: "Customer deleted successfully." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to delete customer.");
  }
};
