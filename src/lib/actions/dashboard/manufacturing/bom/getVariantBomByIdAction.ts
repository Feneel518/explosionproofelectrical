"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";

export async function getVariantBomByIdAction(id: string) {
  await requireAuth();

  const bom = await prisma.variantBom.findUnique({
    where: { id },
    include: {
      variant: {
        select: {
          id: true,
          variant: true,
          sku: true,
          typeNumber: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          rawMaterial: {
            select: {
              id: true,
              companyItemName: true,
              itemCode: true,
              unit: true,
            },
          },
          castingMaster: {
            select: {
              id: true,
              castingItemName: true,
              castingCode: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  if (!bom) {
    return { ok: false as const, message: "BOM not found." };
  }

  return { ok: true as const, bom: serializeForClient(bom) };
}
