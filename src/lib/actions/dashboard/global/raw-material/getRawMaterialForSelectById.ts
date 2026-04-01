"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { RawMaterialSearchItem } from "@/lib/types/RawMaterialSearchItem";

export async function getRawMaterialForSelectById(
  id: string,
): Promise<RawMaterialSearchItem | null> {
  await requireAuth();

  const item = await prisma.rawMaterial.findUnique({
    where: { id },
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

  if (!item) return null;

  return {
    id: item.id,
    companyItemName: item.companyItemName,
    supplierItemName: item.supplierItemName,
    itemCode: item.itemCode,
    hsnCode: item.hsnCode,
    unit: item.unit,
    preferredSupplierName: item.preferredSupplier?.companyName ?? null,
    title: [item.itemCode, item.companyItemName].filter(Boolean).join(" - "),
  };
}
