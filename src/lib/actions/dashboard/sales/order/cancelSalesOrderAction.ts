"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function cancelSalesOrderAction(id: string) {
  const session = await requireAuth();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      deletedAt: true,
      totalDispatchedQty: true,
      totalInvoicedQty: true,
      deliveryChallans: {
        select: { id: true },
        take: 1,
      },
      invoices: {
        select: { id: true },
        where: { status: "FINALIZED" },
        take: 1,
      },
    },
  });

  if (!order) {
    return { ok: false as const, message: "Sales order not found" };
  }

  if (order.deletedAt) {
    return { ok: false as const, message: "Deleted order cannot be cancelled" };
  }

  if (order.status === "CANCELLED") {
    return { ok: false as const, message: "Order is already cancelled" };
  }

  if (order.status === "COMPLETED") {
    return {
      ok: false as const,
      message: "Completed order cannot be cancelled",
    };
  }

  if (
    Number(order.totalDispatchedQty ?? 0) > 0 ||
    Number(order.totalInvoicedQty ?? 0) > 0 ||
    order.deliveryChallans.length > 0 ||
    order.invoices.length > 0
  ) {
    return {
      ok: false as const,
      message:
        "Order with dispatch or finalized invoice activity cannot be cancelled",
    };
  }

  await prisma.$transaction([
    prisma.invoice.updateMany({
      where: { salesOrderId: id, status: "DRAFT" },
      data: { status: "CANCELLED" },
    }),
    prisma.salesOrder.update({
      where: { id },
      data: {
        status: "CANCELLED",
        completionType: null,
        isClosed: true,
        cancelledAt: new Date(),
        completedAt: null,
        updatedById: session.user.id,
      },
    }),
  ]);

  revalidatePath("/dashboard/sales/orders");
  revalidatePath(`/dashboard/sales/orders/${id}`);
  revalidatePath("/dashboard/sales/pending");
  revalidatePath("/dashboard/sales/invoices");

  return { ok: true as const, message: "Order cancelled" };
}
