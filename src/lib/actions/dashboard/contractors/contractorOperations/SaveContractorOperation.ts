"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail, isUniqueConstraintError } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  ContractorOperationSchema,
  ContractorOperationSchemaRequest,
} from "@/lib/validators/dashboard/contractors/ContractorOperationValidator";
import { revalidatePath } from "next/cache";

export const saveContractorOperationAction = async (
  values: ContractorOperationSchemaRequest,
) => {
  const session = await requireAuth();
  const parsed = ContractorOperationSchema.safeParse(values);

  if (!parsed.success) return fail("Enter the fields properly.");
  const data = parsed.data;

  try {
    if (data.id) {
      await prisma.contractorOperation.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description || null,
          status: data.status ?? "ACTIVE",
          updatedById: session.user.id,
        },
      });
    } else {
      await prisma.contractorOperation.create({
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
      message: data.id ? "Operation updated." : "Operation created.",
    };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error, "name")) {
      return fail(`Operation "${data.name}" already exists.`);
    }
    return fail(
      error instanceof Error ? error.message : "Failed to save contractor operation.",
    );
  }
};

export const toggleContractorOperationArchiveAction = async (
  id: string,
  archived: boolean,
) => {
  const session = await requireAuth();
  if (!id) return fail("Missing operation id.");

  try {
    await prisma.contractorOperation.update({
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
      message: archived ? "Operation archived." : "Operation restored.",
    };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to update operation.");
  }
};
