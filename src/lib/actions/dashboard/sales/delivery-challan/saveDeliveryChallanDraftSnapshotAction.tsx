"use server";
import { saveVersionedDraft } from "@/lib/prisma/saveVersionedDraft";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { DeliveryChallanDraftData } from "./createDraftDeliveryChallanAction";

export const saveDeliveryChallanDraftSnapshotAction = async ({
  clientVersion,
  draft,
  deliveryChallanId,
}: {
  deliveryChallanId: string;
  draft: DeliveryChallanDraftData;
  clientVersion: number;
}) => {
  const session = await requirePermission("sales.write");

  const challan = await prisma.deliveryChallan.findUnique({
    where: { id: deliveryChallanId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!challan) {
    return { ok: false as const, message: "Delivery challan not found" };
  }

  if (challan.status !== "DRAFT") {
    return { ok: false as const, message: "Cannot autosave non-draft challan" };
  }

  if (clientVersion !== challan.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: challan.draftVersion,
    };
  }


  return saveVersionedDraft(
    () => prisma.deliveryChallan.update({
    where: { id: deliveryChallanId, status: "DRAFT", draftVersion: clientVersion },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  }),
    () => prisma.deliveryChallan.findUnique({ where: { id: deliveryChallanId }, select: { draftVersion: true } }),
  );
};
