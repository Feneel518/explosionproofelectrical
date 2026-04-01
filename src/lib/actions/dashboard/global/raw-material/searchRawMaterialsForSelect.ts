"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { RawMaterialSearchItem } from "@/lib/types/RawMaterialSearchItem";

interface SearchRawMaterialsForSelectArgs {
  query?: string;
  cursor?: string | null;
  take?: number;
}

export const searchRawMaterialsForSelectAction = async ({
  cursor = null,
  query = "",
  take = 20,
}: SearchRawMaterialsForSelectArgs): Promise<{
  items: RawMaterialSearchItem[];
  nextCursor: string | null;
}> => {
  await requireAuth();

  const q = (query ?? "").trim();
  const takeQty = Math.min(Math.max(take ?? 20, 5), 50);

  const rows = await prisma.rawMaterial.findMany({
    take: takeQty + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: q
        ? [
            { companyItemName: { contains: q, mode: "insensitive" } },
            { supplierItemName: { contains: q, mode: "insensitive" } },
            { itemCode: { contains: q, mode: "insensitive" } },
            { hsnCode: { contains: q, mode: "insensitive" } },
            {
              preferredSupplier: {
                companyName: { contains: q, mode: "insensitive" },
              },
            },
          ]
        : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      companyItemName: true,
      supplierItemName: true,
      itemCode: true,
      hsnCode: true,
      unit: true,
      preferredSupplier: {
        select: {
          companyName: true,
        },
      },
    },
  });

  const hasMore = rows.length > takeQty;
  const sliced = hasMore ? rows.slice(0, takeQty) : rows;

  return {
    items: sliced.map((item) => ({
      id: item.id,
      companyItemName: item.companyItemName,
      supplierItemName: item.supplierItemName,
      itemCode: item.itemCode,
      hsnCode: item.hsnCode,
      unit: item.unit,
      preferredSupplierName: item.preferredSupplier?.companyName ?? null,
      title: [item.itemCode, item.companyItemName].filter(Boolean).join(" - "),
    })),
    nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null,
  };
};
