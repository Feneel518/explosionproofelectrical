"use server";

import { prisma } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/check/permissions";
import type { SupplierSearchItem } from "./searchSuppliersForSelect";

export async function getSupplierForSelectById(
  id: string,
): Promise<SupplierSearchItem | null> {
  await requirePermission("master.read");

  const c = await prisma.supplier.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      city: true,
    },
  });

  return c;
}
