"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export const getContractorRateDetailsAction = async (contractorRateId: string) => {
  await requirePermission("production.read");

  if (!contractorRateId) {
    return { ok: false as const, rate: 0 };
  }

  const rateRow = await prisma.contractorRate.findFirst({
    where: { id: contractorRateId, deletedAt: null, status: "ACTIVE" },
    select: {
      defaultRate: true,
      unit: true,
      sideLabel: true,
      contractorProduct: { select: { name: true } },
      contractorOperation: { select: { name: true } },
    },
  });

  if (!rateRow) return { ok: false as const, rate: 0 };

  return {
    ok: true as const,
    rate: Number(rateRow.defaultRate),
    unit: rateRow.unit,
    sideLabel: rateRow.sideLabel,
    productName: rateRow.contractorProduct.name,
    operationName: rateRow.contractorOperation.name,
  };
};
