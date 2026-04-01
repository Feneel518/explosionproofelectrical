"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function getGrnByIdAction(id: string) {
  await requireAuth();

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

  // Ensure only plain JSON-serializable data is sent to Client Components.
  // Prisma Decimal instances are not supported across the RSC boundary.
  const plainGrn = JSON.parse(JSON.stringify(grn));

  return { ok: true as const, grn: plainGrn };
}
