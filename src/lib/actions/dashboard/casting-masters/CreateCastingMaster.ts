"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  CastingMasterSchema,
  CastingMasterSchemaRequest,
} from "@/lib/validators/dashboard/casting-masters/CastingMasterValidator";

export const createCastingMasterAction = async (
  values: CastingMasterSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = CastingMasterSchema.safeParse(values);
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
        where: { key: "CASTING_MASTER_CODE" },
        create: { key: "CASTING_MASTER_CODE", value: 1 },
        update: { value: { increment: 1 } },
        select: { value: true },
      });

      const autoCode = `CM-${String(counter.value).padStart(3, "0")}`;

      return tx.castingMaster.create({
        data: {
          castingItemName: data.castingItemName.trim(),
          castingCode: autoCode,
          drawingNumber: data.drawingNumber?.trim() || null,
          hsnCode: data.hsnCode?.trim() || null,
          unit: data.unit.trim(),
          standardWeightKg:
            data.standardWeightKg == null ? null : Number(data.standardWeightKg),
          reorderLevel: data.reorderLevel ?? null,
          description: data.description?.trim() || null,
          status: data.status,
          createdById: session.user.id,
          updatedById: session.user.id,
        },
        select: {
          id: true,
          castingItemName: true,
          castingCode: true,
          unit: true,
        },
      });
    });

    revalidatePath("/dashboard/casting-masters");

    return {
      ok: true as const,
      message: "Casting master created successfully.",
      data: response,
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create casting master.");
  }
};
