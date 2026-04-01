"use server";

import { requireAuth } from "@/lib/check/requireAuth";
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
  const session = await requireAuth();

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

  const updated = await prisma.deliveryChallan.update({
    where: { id: deliveryChallanId },
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
};
