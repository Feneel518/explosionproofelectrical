"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import {
  GrnDiscrepancyAction,
  GrnMaterialCheckStatus,
  GrnQuantityCheckStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

function trimOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function updateGrnPostCheckAction({
  grnId,
  materialCheckStatus,
  quantityCheckStatus,
  discrepancyAction,
  checkNotes,
}: {
  grnId: string;
  materialCheckStatus: GrnMaterialCheckStatus;
  quantityCheckStatus: GrnQuantityCheckStatus;
  discrepancyAction?: GrnDiscrepancyAction | null;
  checkNotes?: string | null;
}) {
  const session = await requireAuth();

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id: grnId },
    select: { id: true, status: true },
  });

  if (!grn) {
    return { ok: false as const, message: "GRN not found." };
  }

  if (grn.status !== "FINALIZED") {
    return {
      ok: false as const,
      message: "Post-check can be updated only after GRN is finalized.",
    };
  }

  const hasIssue =
    materialCheckStatus === "CHECKED_NOT_OK" ||
    quantityCheckStatus === "MISMATCH";

  if (hasIssue && !discrepancyAction) {
    return {
      ok: false as const,
      message: "Select an action for the not-ok or mismatch case.",
    };
  }

  const updated = await prisma.goodsReceiptNote.update({
    where: { id: grnId },
    data: {
      materialCheckStatus,
      quantityCheckStatus,
      discrepancyAction: hasIssue ? discrepancyAction ?? null : null,
      checkNotes: trimOrNull(checkNotes),
      checkedAt: new Date(),
      checkedById: session.user.id,
      updatedById: session.user.id,
    },
    select: {
      materialCheckStatus: true,
      quantityCheckStatus: true,
      discrepancyAction: true,
      checkNotes: true,
      checkedAt: true,
    },
  });

  revalidatePath("/dashboard/purchase/grn");
  revalidatePath(`/dashboard/purchase/grn/${grnId}`);

  return {
    ok: true as const,
    message: "Post-check status updated.",
    data: updated,
  };
}
