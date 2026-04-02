"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { CastingSearchItem } from "@/lib/types/CastingSearchItem";

export async function getCastingForSelectById(
  id: string,
): Promise<CastingSearchItem | null> {
  await requireAuth();

  if (!id) return null;

  const row = await prisma.castingMaster.findFirst({
    where: {
      id,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      castingItemName: true,
      castingCode: true,
      drawingNumber: true,
      hsnCode: true,
      unit: true,
      standardWeightKg: true,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    castingItemName: row.castingItemName,
    castingCode: row.castingCode,
    drawingNumber: row.drawingNumber,
    hsnCode: row.hsnCode,
    unit: row.unit,
    standardWeightKg: row.standardWeightKg == null ? null : Number(row.standardWeightKg),
    title: [row.castingCode, row.castingItemName].filter(Boolean).join(" - "),
  };
}
