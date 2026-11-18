"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

export async function getMaterialIssueByIdAction(id: string) {
  await requirePermission("inventory.read");

  const materialIssue = await prisma.materialIssue.findUnique({
    where: { id },
    include: {
      issuedToEmployee: {
        select: { employeeCode: true, name: true, department: true, designation: true },
      },
      items: {
        orderBy: { sortOrder: "asc" },
      },
      returns: {
        where: { status: "FINALIZED" },
        orderBy: { returnDate: "desc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!materialIssue) {
    return { ok: false as const, message: "Material issue not found." };
  }

  return { ok: true as const, materialIssue: serializeForClient(materialIssue) };
}
