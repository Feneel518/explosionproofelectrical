"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const closeDeliveryChallanAction = async (
  challanId: string,
  items: {
    id: string;
    closedQty: number;
  }[],
  closureRemarks?: string,
) => {
  const session = await requireAuth();

  const challan = await prisma.deliveryChallan.findUnique({
    where: { id: challanId },
    select: {
      id: true,
      status: true,
      items: {
        select: {
          id: true,
          qty: true,
          closedQty: true,
          pendingQty: true,
        },
      },
    },
  });

  if (!challan) {
    return { ok: false as const, message: "Challan not found" };
  }

  if (challan.status === "CLOSED") {
    return { ok: false as const, message: "Challan already closed" };
  }

  if (challan.status === "CANCELLED") {
    return {
      ok: false as const,
      message: "Cancelled challan cannot be closed",
    };
  }

  let allClosed = true;
  const updates: Prisma.PrismaPromise<any>[] = [];

  for (const item of items) {
    const original = challan.items.find((i) => i.id === item.id);
    if (!original) continue;

    const nextClosedQty = Math.max(0, Math.min(item.closedQty, original.qty));
    const nextPendingQty = Math.max(0, original.qty - nextClosedQty);

    if (nextPendingQty > 0) {
      allClosed = false;
    }

    updates.push(
      prisma.deliveryChallanItem.update({
        where: { id: item.id },
        data: {
          closedQty: nextClosedQty,
          pendingQty: nextPendingQty,
        },
      }),
    );
  }

  updates.push(
    prisma.deliveryChallan.update({
      where: { id: challanId },
      data: {
        status: allClosed ? "CLOSED" : "PARTIALLY_CLOSED",
        closedAt: allClosed ? new Date() : null,
        closureRemarks: closureRemarks?.trim() || null,
        closedBy: {
          connect: { id: session.user.id },
        },
      },
    }),
  );

  await prisma.$transaction(updates);

  revalidatePath("/dashboard/sales/delivery-challans");
  revalidatePath(`/dashboard/sales/delivery-challans/${challanId}`);

  return {
    ok: true as const,
    message: allClosed
      ? "Challan closed successfully"
      : "Challan partially closed",
  };
};
