"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function completeSalesOrderAction(id: string) {
  const session = await requireAuth();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!order) {
    return { ok: false as const, message: "Sales order not found" };
  }

  if (order.deletedAt) {
    return { ok: false as const, message: "Deleted order cannot be completed" };
  }

  if (order.status === "DRAFT") {
    return {
      ok: false as const,
      message: "Finalize the order before marking it completed",
    };
  }

  if (order.status === "CANCELLED") {
    return {
      ok: false as const,
      message: "Cancelled order cannot be marked completed",
    };
  }

  if (order.status === "COMPLETED") {
    return { ok: false as const, message: "Order is already completed" };
  }

  await prisma.salesOrder.update({
    where: { id },
    data: {
      status: "COMPLETED",
      isClosed: true,
      completedAt: new Date(),
      cancelledAt: null,
      updatedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/sales/orders");
  revalidatePath(`/dashboard/sales/orders/${id}`);
  revalidatePath("/dashboard/sales/pending");

  return { ok: true as const, message: "Order marked as completed" };
}
