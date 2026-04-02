"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { CastingSearchItem } from "@/lib/types/CastingSearchItem";

interface SearchCastingsForSelectArgs {
  query?: string;
  cursor?: string | null;
  take?: number;
}

export const searchCastingsForSelectAction = async ({
  cursor = null,
  query = "",
  take = 20,
}: SearchCastingsForSelectArgs): Promise<{
  items: CastingSearchItem[];
  nextCursor: string | null;
}> => {
  await requireAuth();

  const q = (query ?? "").trim();
  const takeQty = Math.min(Math.max(take ?? 20, 5), 50);

  const rows = await prisma.castingMaster.findMany({
    take: takeQty + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: q
        ? [
            { castingItemName: { contains: q, mode: "insensitive" } },
            { castingCode: { contains: q, mode: "insensitive" } },
            { drawingNumber: { contains: q, mode: "insensitive" } },
            { hsnCode: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
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

  const hasMore = rows.length > takeQty;
  const sliced = hasMore ? rows.slice(0, takeQty) : rows;

  return {
    items: sliced.map((item) => ({
      id: item.id,
      castingItemName: item.castingItemName,
      castingCode: item.castingCode,
      drawingNumber: item.drawingNumber,
      hsnCode: item.hsnCode,
      unit: item.unit,
      standardWeightKg:
        item.standardWeightKg == null ? null : Number(item.standardWeightKg),
      title: [item.castingCode, item.castingItemName].filter(Boolean).join(" - "),
    })),
    nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null,
  };
};
