"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

export async function getGrnByIdAction(id: string) {
  await requirePermission("inventory.read");

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!grn) {
    return { ok: false as const, message: "GRN not found." };
  }

  return { ok: true as const, grn: serializeForClient(grn) };
}
