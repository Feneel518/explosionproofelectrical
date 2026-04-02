"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import {
  VariantBomSchema,
  VariantBomSchemaRequest,
} from "@/lib/validators/dashboard/manufacturing/bom/BomValidator";

export async function upsertVariantBomAction(values: VariantBomSchemaRequest) {
  const session = await requireAuth();

  const parsed = VariantBomSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Please check BOM fields.",
    };
  }

  const data = parsed.data;

  try {
    const [variant, rawMaterialRows, castingRows] = await Promise.all([
      prisma.productVariant.findUnique({
        where: { id: data.variantId },
        select: { id: true },
      }),
      prisma.rawMaterial.findMany({
        where: {
          id: {
            in: data.items
              .map((item) => item.rawMaterialId)
              .filter((id): id is string => Boolean(id)),
          },
          deletedAt: null,
        },
        select: { id: true },
      }),
      prisma.castingMaster.findMany({
        where: {
          id: {
            in: data.items
              .map((item) => item.castingMasterId)
              .filter((id): id is string => Boolean(id)),
          },
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    if (!variant) {
      return { ok: false as const, message: "Product variant not found." };
    }

    const rawIdSet = new Set(rawMaterialRows.map((row) => row.id));
    const castingIdSet = new Set(castingRows.map((row) => row.id));

    for (const item of data.items) {
      if (item.componentType === "RAW_MATERIAL" && item.rawMaterialId) {
        if (!rawIdSet.has(item.rawMaterialId)) {
          return {
            ok: false as const,
            message: "One or more raw material lines are invalid.",
          };
        }
      }

      if (item.componentType === "CASTING" && item.castingMasterId) {
        if (!castingIdSet.has(item.castingMasterId)) {
          return {
            ok: false as const,
            message: "One or more casting lines are invalid.",
          };
        }
      }
    }

    const existingByVariant = await prisma.variantBom.findUnique({
      where: { variantId: data.variantId },
      select: { id: true },
    });

    if (data.id && existingByVariant && existingByVariant.id !== data.id) {
      return {
        ok: false as const,
        message: "This variant already has another BOM.",
      };
    }

    const bomId = await prisma.$transaction(async (tx) => {
      const targetBom = data.id
        ? await tx.variantBom.findUnique({
            where: { id: data.id },
            select: { id: true },
          })
        : existingByVariant;

      let targetId: string;

      if (!targetBom) {
        const created = await tx.variantBom.create({
          data: {
            variantId: data.variantId,
            isActive: data.isActive,
            notes: data.notes?.trim() || null,
            createdById: session.user.id,
            updatedById: session.user.id,
          },
          select: { id: true },
        });
        targetId = created.id;
      } else {
        await tx.variantBom.update({
          where: { id: targetBom.id },
          data: {
            variantId: data.variantId,
            isActive: data.isActive,
            notes: data.notes?.trim() || null,
            updatedById: session.user.id,
          },
        });
        targetId = targetBom.id;
      }

      await tx.variantBomItem.deleteMany({
        where: { bomId: targetId },
      });

      for (let index = 0; index < data.items.length; index += 1) {
        const item = data.items[index];
        await tx.variantBomItem.create({
          data: {
            bomId: targetId,
            componentType: item.componentType,
            rawMaterialId:
              item.componentType === "RAW_MATERIAL" ? item.rawMaterialId || null : null,
            castingMasterId:
              item.componentType === "CASTING" ? item.castingMasterId || null : null,
            qtyPerUnit: item.qtyPerUnit,
            remarks: item.remarks?.trim() || null,
            sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
          },
        });
      }

      return targetId;
    });

    revalidatePath("/dashboard/manufacturing/bom");
    revalidatePath(`/dashboard/manufacturing/bom/${bomId}/edit`);

    return {
      ok: true as const,
      message: "BOM saved successfully.",
      id: bomId,
    };
  } catch (error: any) {
    return {
      ok: false as const,
      message: error?.message || "Failed to save BOM.",
    };
  }
}
