"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail, isUniqueConstraintError } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  ContractorProductSchema,
  ContractorProductSchemaRequest,
} from "@/lib/validators/dashboard/contractors/ContractorProductValidator";
import { revalidatePath } from "next/cache";

export const saveContractorProductAction = async (
  values: ContractorProductSchemaRequest,
) => {
  const session = await requireAuth();
  const parsed = ContractorProductSchema.safeParse(values);

  if (!parsed.success) return fail("Enter the fields properly.");
  const data = parsed.data;

  try {
    if (data.id) {
      await prisma.contractorProduct.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description || null,
          status: data.status ?? "ACTIVE",
          updatedById: session.user.id,
        },
      });
    } else {
      await prisma.contractorProduct.create({
        data: {
          name: data.name,
          description: data.description || null,
          status: data.status ?? "ACTIVE",
          createdById: session.user.id,
        },
      });
    }

    revalidatePath("/dashboard/contractors/rate-catalog");
    return {
      ok: true,
      message: data.id ? "Product updated." : "Product created.",
    };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error, "name")) {
      return fail(`Product "${data.name}" already exists.`);
    }
    return fail(
      error instanceof Error ? error.message : "Failed to save contractor product.",
    );
  }
};

export const toggleContractorProductArchiveAction = async (
  id: string,
  archived: boolean,
) => {
  const session = await requireAuth();
  if (!id) return fail("Missing product id.");

  try {
    await prisma.contractorProduct.update({
      where: { id },
      data: archived
        ? {
            deletedAt: new Date(),
            deletedById: session.user.id,
            status: "INACTIVE",
          }
        : {
            deletedAt: null,
            deletedById: null,
            status: "ACTIVE",
            updatedById: session.user.id,
          },
    });

    revalidatePath("/dashboard/contractors/rate-catalog");
    return {
      ok: true,
      message: archived ? "Product archived." : "Product restored.",
    };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to update product.");
  }
};
