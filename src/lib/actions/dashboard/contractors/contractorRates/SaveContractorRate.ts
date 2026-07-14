"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  ContractorRateSchema,
  ContractorRateSchemaRequest,
} from "@/lib/validators/dashboard/contractors/ContractorRateValidator";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export const saveContractorRateAction = async (
  values: ContractorRateSchemaRequest,
) => {
  const session = await requireAuth();
  const parsed = ContractorRateSchema.safeParse(values);

  if (!parsed.success) return fail("Enter the fields properly.");
  const data = parsed.data;

  try {
    const payload = {
      contractorProductId: data.contractorProductId,
      contractorOperationId: data.contractorOperationId,
      sideLabel: data.sideLabel || null,
      unit: data.unit ?? "Nos",
      defaultRate: new Prisma.Decimal(data.defaultRate),
      role: data.role ?? null,
      status: data.status ?? "ACTIVE",
      notes: data.notes || null,
    };

    if (data.id) {
      await prisma.contractorRate.update({
        where: { id: data.id },
        data: {
          ...payload,
          updatedById: session.user.id,
        },
      });
    } else {
      await prisma.contractorRate.create({
        data: {
          ...payload,
          createdById: session.user.id,
        },
      });
    }

    revalidatePath("/dashboard/contractors/rate-catalog");
    revalidatePath("/dashboard/contractors/entries");
    return {
      ok: true,
      message: data.id ? "Rate row updated." : "Rate row created.",
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That product + operation + side combination already exists.");
    }
    return fail(error instanceof Error ? error.message : "Failed to save contractor rate.");
  }
};

export const toggleContractorRateArchiveAction = async (
  id: string,
  archived: boolean,
) => {
  const session = await requireAuth();
  if (!id) return fail("Missing rate id.");

  try {
    await prisma.contractorRate.update({
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
    revalidatePath("/dashboard/contractors/entries");
    return {
      ok: true,
      message: archived ? "Rate row archived." : "Rate row restored.",
    };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to update rate row.");
  }
};
