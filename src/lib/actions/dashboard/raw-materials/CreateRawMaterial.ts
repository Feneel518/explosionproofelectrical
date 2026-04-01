"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  RawMaterialSchema,
  RawMaterialSchemaRequest,
} from "@/lib/validators/dashboard/raw-materials/RawMaterialValidator";
import { revalidatePath } from "next/cache";

export const createRawMaterialAction = async (
  values: RawMaterialSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = RawMaterialSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  try {
    const response = await prisma.$transaction(async (tx) => {
      const counter = await tx.fiscalCounter.upsert({
        where: { key: "RAW_MATERIAL_CODE" },
        create: { key: "RAW_MATERIAL_CODE", value: 1 },
        update: { value: { increment: 1 } },
        select: { value: true },
      });

      const autoItemCode = `RM-${String(counter.value).padStart(3, "0")}`;

      return tx.rawMaterial.create({
        data: {
          companyItemName: data.companyItemName.trim(),
          supplierItemName: data.supplierItemName?.trim() || null,
          itemCode: autoItemCode,
          hsnCode: data.hsnCode?.trim() || null,
          unit: data.unit.trim(),
          description: data.description?.trim() || null,
          reorderLevel: data.reorderLevel ?? null,
          preferredSupplierId: data.preferredSupplierId || null,
          status: data.status,
          createdById: session.user.id,
          updatedById: session.user.id,
        },
        select: {
          id: true,
          companyItemName: true,
          itemCode: true,
          unit: true,
        },
      });
    });

    revalidatePath("/dashboard/raw-materials");

    return {
      ok: true as const,
      message: "Raw material created successfully.",
      data: response,
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create raw material.");
  }
};
