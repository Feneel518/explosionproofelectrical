import type { Prisma } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

/**
 * Rebuilds invoice-driven order progress from finalized invoices.
 *
 * Keeping this derived data in one place prevents an order from remaining
 * completed after its invoice is reopened or otherwise stops being finalized.
 */
export async function syncSalesOrderInvoiceProgress(
  tx: TransactionClient,
  salesOrderId: string,
  updatedById: string,
) {
  const [order, orderItems, finalizedInvoiceItems, finalizedInvoiceCount] =
    await Promise.all([
      tx.salesOrder.findUnique({
        where: { id: salesOrderId },
        select: {
          id: true,
          status: true,
          completionType: true,
          firstInvoicedAt: true,
          completedAt: true,
        },
      }),
      tx.salesOrderItem.findMany({
        where: { salesOrderId },
        select: { id: true, qty: true },
      }),
      tx.invoiceItem.groupBy({
        by: ["salesOrderItemId"],
        where: {
          invoice: {
            salesOrderId,
            status: "FINALIZED",
          },
        },
        _sum: { qty: true },
      }),
      tx.invoice.count({
        where: { salesOrderId, status: "FINALIZED" },
      }),
    ]);

  if (!order) {
    throw new Error("Sales order not found");
  }

  const invoicedQtyByItemId = new Map(
    finalizedInvoiceItems.map((item) => [
      item.salesOrderItemId,
      Number(item._sum.qty ?? 0),
    ]),
  );

  const itemProgress = orderItems.map((item) => {
    const invoicedQty = Math.min(
      item.qty,
      invoicedQtyByItemId.get(item.id) ?? 0,
    );

    return {
      ...item,
      invoicedQty,
      // In the current workflow, finalizing an invoice also dispatches its qty.
      dispatchedQty: invoicedQty,
      pendingQty: Math.max(item.qty - invoicedQty, 0),
    };
  });

  for (const item of itemProgress) {
    await tx.salesOrderItem.update({
      where: { id: item.id },
      data: {
        invoicedQty: item.invoicedQty,
        dispatchedQty: item.dispatchedQty,
        pendingQty: item.pendingQty,
      },
    });
  }

  const totalOrderedQty = itemProgress.reduce((sum, item) => sum + item.qty, 0);
  const totalInvoicedQty = itemProgress.reduce(
    (sum, item) => sum + item.invoicedQty,
    0,
  );
  const totalDispatchedQty = itemProgress.reduce(
    (sum, item) => sum + item.dispatchedQty,
    0,
  );
  const totalPendingQty = itemProgress.reduce(
    (sum, item) => sum + item.pendingQty,
    0,
  );

  const hasFinalizedInvoice = finalizedInvoiceCount > 0;
  const isFullyInvoiced =
    hasFinalizedInvoice &&
    itemProgress.length > 0 &&
    itemProgress.every((item) => item.invoicedQty >= item.qty);
  const isFullyDispatched =
    hasFinalizedInvoice &&
    itemProgress.length > 0 &&
    itemProgress.every((item) => item.dispatchedQty >= item.qty);

  let status:
    | "CONFIRMED"
    | "PARTIALLY_DISPATCHED"
    | "DISPATCHED"
    | "PARTIALLY_INVOICED"
    | "INVOICED"
    | "COMPLETED" = "CONFIRMED";

  if (hasFinalizedInvoice && isFullyInvoiced && isFullyDispatched) {
    status = "COMPLETED";
  } else if (isFullyInvoiced) {
    status = "INVOICED";
  } else if (totalInvoicedQty > 0) {
    status = "PARTIALLY_INVOICED";
  } else if (isFullyDispatched) {
    status = "DISPATCHED";
  } else if (totalDispatchedQty > 0) {
    status = "PARTIALLY_DISPATCHED";
  }

  const now = new Date();

  const isManuallyCompleted =
    order.status === "COMPLETED" && order.completionType === "MANUAL";
  const effectiveStatus =
    order.status === "CANCELLED"
      ? "CANCELLED"
      : isManuallyCompleted
        ? "COMPLETED"
        : status;
  const completionType =
    effectiveStatus === "COMPLETED"
      ? isManuallyCompleted
        ? "MANUAL"
        : "INVOICED"
      : null;

  await tx.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      totalOrderedQty,
      totalDispatchedQty,
      totalInvoicedQty,
      totalPendingQty,
      isFullyInvoiced,
      isFullyDispatched,
      isClosed:
        effectiveStatus === "COMPLETED" || effectiveStatus === "CANCELLED",
      firstInvoicedAt:
        totalInvoicedQty > 0 ? (order.firstInvoicedAt ?? now) : null,
      fullyInvoicedAt: isFullyInvoiced ? now : null,
      completedAt:
        effectiveStatus === "COMPLETED" ? (order.completedAt ?? now) : null,
      completionType,
      status: effectiveStatus,
      updatedById,
    },
  });
}
