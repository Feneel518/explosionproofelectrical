"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

const RESTOCK_ON_CLOSE_TYPES = new Set(["RETURNABLE", "SAMPLE", "JOB_WORK"]);

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
      type: true,
      challanCode: true,
      items: {
        select: {
          id: true,
          productVariantId: true,
          title: true,
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

  const requestedById = new Map(
    items.map((item) => [item.id, Number(item.closedQty || 0)]),
  );

  const nextRows = challan.items.map((original) => {
    const requestedClosedQty = requestedById.has(original.id)
      ? (requestedById.get(original.id) ?? 0)
      : Number(original.closedQty || 0);

    const safeRequestedClosedQty = Number.isFinite(requestedClosedQty)
      ? requestedClosedQty
      : Number(original.closedQty || 0);

    const nextClosedQty = Math.max(
      0,
      Math.min(safeRequestedClosedQty, Number(original.qty || 0)),
    );
    const nextPendingQty = Math.max(0, Number(original.qty || 0) - nextClosedQty);
    const returnedQtyDelta = Math.max(
      0,
      nextClosedQty - Number(original.closedQty || 0),
    );

    return {
      ...original,
      nextClosedQty,
      nextPendingQty,
      returnedQtyDelta,
    };
  });

  const allClosed = nextRows.every((item) => item.nextPendingQty <= 0);
  const shouldRestockReturns = RESTOCK_ON_CLOSE_TYPES.has(challan.type);

  await prisma.$transaction(async (tx) => {
    for (const row of nextRows) {
      await tx.deliveryChallanItem.update({
        where: { id: row.id },
        data: {
          closedQty: row.nextClosedQty,
          pendingQty: row.nextPendingQty,
        },
      });

      if (
        shouldRestockReturns &&
        row.returnedQtyDelta > 0 &&
        row.productVariantId
      ) {
        await postStockMovement(tx, {
          productVariantId: row.productVariantId,
          movementType: "RETURN_IN",
          referenceType: "DELIVERY_CHALLAN",
          referenceId: challanId,
          referenceNo: challan.challanCode,
          qty: row.returnedQtyDelta,
          movementDate: new Date(),
          actorName: session.user.email ?? null,
          remarks: `Return received via delivery challan ${challan.challanCode} (${row.title})`,
          createdById: session.user.id,
        });
      }
    }

    await tx.deliveryChallan.update({
      where: { id: challanId },
      data: {
        status: allClosed ? "CLOSED" : "PARTIALLY_CLOSED",
        closedAt: allClosed ? new Date() : null,
        closureRemarks: closureRemarks?.trim() || null,
        closedBy: {
          connect: { id: session.user.id },
        },
      },
    });
  });

  revalidatePath("/dashboard/sales/delivery-challans");
  revalidatePath(`/dashboard/sales/delivery-challans/${challanId}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");

  return {
    ok: true as const,
    message: allClosed
      ? "Challan closed successfully"
      : "Challan partially closed",
  };
};
