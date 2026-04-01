"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { GrnDraftData } from "./createDraftGrnAction";

export async function saveGrnDraftSnapshotAction({
  grnId,
  draft,
  clientVersion,
}: {
  grnId: string;
  draft: GrnDraftData;
  clientVersion: number;
}) {
  const session = await requireAuth();

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id: grnId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!grn) {
    return { ok: false as const, message: "GRN not found." };
  }

  if (grn.status !== "DRAFT") {
    return { ok: false as const, message: "Only draft GRN can be saved." };
  }

  if (clientVersion !== grn.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: grn.draftVersion,
    };
  }

  const updated = await prisma.goodsReceiptNote.update({
    where: { id: grnId },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  });

  return {
    ok: true as const,
    serverVersion: updated.draftVersion,
    savedAt: updated.updatedAt.toISOString(),
  };
}

