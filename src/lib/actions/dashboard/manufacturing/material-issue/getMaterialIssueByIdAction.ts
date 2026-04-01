"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function getMaterialIssueByIdAction(id: string) {
  await requireAuth();

  const materialIssue = await prisma.materialIssue.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!materialIssue) {
    return { ok: false as const, message: "Material issue not found." };
  }

  return { ok: true as const, materialIssue };
}

