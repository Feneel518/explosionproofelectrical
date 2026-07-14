"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/dashboard/sales/orders");
  revalidatePath(`/dashboard/sales/orders/${orderId}`);
  revalidatePath("/dashboard/sales/invoices");
}

export async function completeSalesOrderManuallyAction(orderId: string) {
  const session = await requireAuth();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        select: { status: true, deletedAt: true },
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
          message: "Finalize the sales order before completing it",
        };
      }

      if (order.status === "CANCELLED") {
        return { ok: false as const, message: "Cancelled order cannot be completed" };
      }

      if (order.status === "COMPLETED") {
        return { ok: false as const, message: "Order is already completed" };
      }

      await tx.invoice.updateMany({
        where: { salesOrderId: orderId, status: "DRAFT" },
        data: { status: "CANCELLED" },
      });

      await tx.salesOrder.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completionType: "MANUAL",
          completedAt: new Date(),
          cancelledAt: null,
          isClosed: true,
          updatedById: session.user.id,
        },
      });

      return { ok: true as const, message: "Order completed manually" };
    });

    if (result.ok) revalidateOrderPaths(orderId);
    return result;
  } catch (error) {
    console.error("completeSalesOrderManuallyAction", error);
    return { ok: false as const, message: "Failed to complete order" };
  }
}

export async function cancelSalesOrderAction(orderId: string) {
  const session = await requireAuth();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          deletedAt: true,
          _count: {
            select: {
              invoices: { where: { status: "FINALIZED" } },
            },
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

      if (order._count.invoices > 0) {
        return {
          ok: false as const,
          message: "A finalized invoice exists. Cancel it before cancelling the order.",
        };
      }

      await tx.invoice.updateMany({
        where: { salesOrderId: orderId, status: "DRAFT" },
        data: { status: "CANCELLED" },
      });

      await tx.salesOrder.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          completionType: null,
          completedAt: null,
          cancelledAt: new Date(),
          isClosed: true,
          updatedById: session.user.id,
        },
      });

      return { ok: true as const, message: "Order cancelled" };
    });

    if (result.ok) revalidateOrderPaths(orderId);
    return result;
  } catch (error) {
    console.error("cancelSalesOrderAction", error);
    return { ok: false as const, message: "Failed to cancel order" };
  }
}
