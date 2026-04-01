"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { SalesOrderDraftData } from "@/lib/types/SalesOrderTypes";

export const saveSalesOrderDraftSnapshotAction = async ({
  salesOrderId,
  draft,
  clientVersion,
}: {
  salesOrderId: string;
  draft: SalesOrderDraftData;
  clientVersion: number;
}) => {
  const session = await requireAuth();

  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!order) return { ok: false as const, message: "Order not found" };
  if (order.status !== "DRAFT")
    return { ok: false as const, message: "Cannot autosave non-draft order" };

  if (clientVersion !== order.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: order.draftVersion,
    };
  }

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: {
      draftVersion: true,
      updatedAt: true,
    },
  });

  return {
    ok: true as const,
    serverVersion: updated.draftVersion,
    savedAt: updated.updatedAt.toISOString(),
  };
};
