"use server";
import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { saveVersionedDraft } from "@/lib/prisma/saveVersionedDraft";

import { requirePermission } from "@/lib/check/permissions";
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
  const session = await requirePermission("inventory.write");

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id: grnId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!grn) {
    return { ok: false as const, message: "GRN not found." };
  }

  if (grn.status === "CANCELLED") {
    return { ok: false as const, message: "Reopen the GRN through the correction workflow before saving a draft." };
  }

  if (grn.status === "FINALIZED") await requireInventoryAccess("MANAGE");
  if (clientVersion !== grn.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: grn.draftVersion,
    };
  }


  return saveVersionedDraft(
    () => prisma.goodsReceiptNote.update({
    where: { id: grnId, status: grn.status, draftVersion: clientVersion },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  }),
    () => prisma.goodsReceiptNote.findUnique({ where: { id: grnId }, select: { draftVersion: true } }),
  );
}
