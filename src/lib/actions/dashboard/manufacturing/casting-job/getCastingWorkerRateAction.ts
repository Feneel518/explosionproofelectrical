"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export async function getCastingWorkerRateAction(workerId: string, castingMasterId: string) {
  await requirePermission("production.read");
  if (!workerId || !castingMasterId) return { ok: true as const, ratePerKg: 0 };

  const rate = await prisma.castingWorkerRate.findUnique({
    where: { workerId_castingMasterId: { workerId, castingMasterId } },
    select: { ratePerKg: true },
  });

  return { ok: true as const, ratePerKg: Number(rate?.ratePerKg ?? 0) };
}
