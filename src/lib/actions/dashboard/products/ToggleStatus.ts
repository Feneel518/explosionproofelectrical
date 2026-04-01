"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export const ToggleStatus = async (id: string) => {
  const session = await requireAuth();

  if (!id) {
    return {
      ok: false,
      message: "No Id received to toggle status.",
    };
  }

  try {
    const exist = await prisma.productVariant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!exist) {
      return {
        ok: false,
        message: "No Product variant found in database.",
      };
    }

    const response = await prisma.productVariant.update({
      where: {
        id,
      },
      data: {
        status: exist.status === "INACTIVE" ? "ACTIVE" : "INACTIVE",
      },
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${response.productId}`);

    return {
      ok: true,
      message: "The product variant is deavtivated.",
    };
  } catch (error) {
    return fail("Failed to create product");
  }
};
