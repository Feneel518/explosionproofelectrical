"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const getSalesOrderDraftAction = async (id: string) => {
  await requireAuth();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      draftData: true,
      draftVersion: true,
      orderFy: true,
      orderNo: true,
    },
  });

  if (!order) {
    return { ok: false as const, message: "Sales order not found" };
  }

  if (order.status !== "DRAFT") {
    return { ok: false as const, message: "Not a draft order" };
  }

  const draft = order.draftData ?? {
    header: {},
    items: [],
  };

  return {
    ok: true as const,
    salesOrderId: order.id,
    draft,
    draftVersion: order.draftVersion,
    orderFY: order.orderFy,
    orderNo: order.orderNo,
  };
};
