"use server";

import { Prisma } from "@prisma/client";

type RollbackInvoiceEffectsArgs = {
  invoiceId: string;
  salesOrderId: string | null;
};

type RefreshSalesOrderInvoiceProgressArgs = {
  salesOrderId: string;
  updatedById: string | null;
};

export async function rollbackInvoiceEffects(
  tx: Prisma.TransactionClient,
  { invoiceId, salesOrderId }: RollbackInvoiceEffectsArgs,
) {
  const existingInvoiceItems = await tx.invoiceItem.findMany({
    where: { invoiceId },
    select: {
      salesOrderItemId: true,
      qty: true,
    },
  });

  if (salesOrderId) {
    const rollbackQtyBySalesOrderItemId = new Map<string, number>();

    for (const row of existingInvoiceItems) {
      if (!row.salesOrderItemId) continue;
      const qty = Math.max(0, Number(row.qty || 0));
      if (qty <= 0) continue;

      const current = rollbackQtyBySalesOrderItemId.get(row.salesOrderItemId) ?? 0;
      rollbackQtyBySalesOrderItemId.set(row.salesOrderItemId, current + qty);
    }

    if (rollbackQtyBySalesOrderItemId.size > 0) {
      const targetItemIds = Array.from(rollbackQtyBySalesOrderItemId.keys());
      const liveOrderItems = await tx.salesOrderItem.findMany({
        where: {
          salesOrderId,
          id: { in: targetItemIds },
        },
        select: {
          id: true,
          qty: true,
          invoicedQty: true,
          dispatchedQty: true,
        },
      });

      for (const live of liveOrderItems) {
        const rollbackQty = rollbackQtyBySalesOrderItemId.get(live.id) ?? 0;
        if (rollbackQty <= 0) continue;

        const newInvoicedQty = Math.max(0, Number(live.invoicedQty || 0) - rollbackQty);
        const newDispatchedQty = Math.max(
          0,
          Number(live.dispatchedQty || 0) - rollbackQty,
        );
        const newPendingQty = Math.max(0, Number(live.qty || 0) - newInvoicedQty);

        await tx.salesOrderItem.update({
          where: { id: live.id },
          data: {
            invoicedQty: newInvoicedQty,
            dispatchedQty: newDispatchedQty,
            pendingQty: newPendingQty,
          },
        });
      }
    }
  }

  const existingLedgerRows = await tx.stockLedger.findMany({
    where: {
      referenceType: "INVOICE",
      referenceId: invoiceId,
    },
    select: {
      rawMaterialId: true,
      productVariantId: true,
      castingMasterId: true,
      qtyIn: true,
      qtyOut: true,
    },
  });

  if (existingLedgerRows.length > 0) {
    const stockDeltaByKey = new Map<
      string,
      {
        rawMaterialId: string | null;
        productVariantId: string | null;
        castingMasterId: string | null;
        deltaOnHand: number;
      }
    >();

    for (const row of existingLedgerRows) {
      const key = row.rawMaterialId
        ? `RM:${row.rawMaterialId}`
        : row.productVariantId
          ? `PV:${row.productVariantId}`
          : row.castingMasterId
            ? `CM:${row.castingMasterId}`
            : null;
      if (!key) continue;

      const effect = Number(row.qtyIn || 0) - Number(row.qtyOut || 0);
      const existing = stockDeltaByKey.get(key);

      if (existing) {
        existing.deltaOnHand += effect;
      } else {
        stockDeltaByKey.set(key, {
          rawMaterialId: row.rawMaterialId ?? null,
          productVariantId: row.productVariantId ?? null,
          castingMasterId: row.castingMasterId ?? null,
          deltaOnHand: effect,
        });
      }
    }

    const now = new Date();

    for (const deltaRow of stockDeltaByKey.values()) {
      if (deltaRow.deltaOnHand === 0) continue;

      const where = deltaRow.rawMaterialId
        ? { rawMaterialId: deltaRow.rawMaterialId }
        : deltaRow.productVariantId
          ? { productVariantId: deltaRow.productVariantId }
          : { castingMasterId: deltaRow.castingMasterId };

      const existingBalance = await tx.stockBalance.findFirst({
        where,
        select: {
          id: true,
          qtyOnHand: true,
          qtyReserved: true,
        },
      });

      const currentOnHand = Number(existingBalance?.qtyOnHand || 0);
      const currentReserved = Number(existingBalance?.qtyReserved || 0);
      const nextOnHand = currentOnHand - deltaRow.deltaOnHand;
      const nextAvailable = nextOnHand - currentReserved;

      if (existingBalance) {
        await tx.stockBalance.update({
          where: { id: existingBalance.id },
          data: {
            qtyOnHand: nextOnHand,
            qtyAvailable: nextAvailable,
            lastMovementAt: now,
          },
        });
      } else {
        await tx.stockBalance.create({
          data: {
            rawMaterialId: deltaRow.rawMaterialId,
            productVariantId: deltaRow.productVariantId,
            castingMasterId: deltaRow.castingMasterId,
            qtyOnHand: nextOnHand,
            qtyReserved: 0,
            qtyAvailable: nextOnHand,
            lastMovementAt: now,
          },
        });
      }
    }

    await tx.stockLedger.deleteMany({
      where: {
        referenceType: "INVOICE",
        referenceId: invoiceId,
      },
    });
  }
}

export async function refreshSalesOrderInvoiceProgress(
  tx: Prisma.TransactionClient,
  { salesOrderId, updatedById }: RefreshSalesOrderInvoiceProgressArgs,
) {
  const refreshedItems = await tx.salesOrderItem.findMany({
    where: { salesOrderId },
    select: {
      qty: true,
      invoicedQty: true,
      dispatchedQty: true,
    },
  });

  const totalOrderedQty = refreshedItems.reduce((a, i) => a + Number(i.qty || 0), 0);
  const totalInvoicedQty = refreshedItems.reduce(
    (a, i) => a + Number(i.invoicedQty || 0),
    0,
  );
  const totalDispatchedQty = refreshedItems.reduce(
    (a, i) => a + Number(i.dispatchedQty || 0),
    0,
  );
  const totalPendingQty = refreshedItems.reduce(
    (a, i) => a + Math.max(Number(i.qty || 0) - Number(i.invoicedQty || 0), 0),
    0,
  );

  const isFullyInvoiced =
    refreshedItems.length > 0 &&
    refreshedItems.every((i) => Number(i.invoicedQty || 0) >= Number(i.qty || 0));

  const isFullyDispatched =
    refreshedItems.length > 0 &&
    refreshedItems.every((i) => Number(i.dispatchedQty || 0) >= Number(i.qty || 0));

  let status:
    | "CONFIRMED"
    | "PARTIALLY_DISPATCHED"
    | "DISPATCHED"
    | "PARTIALLY_INVOICED"
    | "INVOICED"
    | "COMPLETED" = "CONFIRMED";

  if (isFullyInvoiced && isFullyDispatched) {
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

  await tx.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      totalOrderedQty,
      totalDispatchedQty,
      totalInvoicedQty,
      totalPendingQty,
      isFullyInvoiced,
      isFullyDispatched,
      firstInvoicedAt: totalInvoicedQty > 0 ? new Date() : undefined,
      fullyInvoicedAt: isFullyInvoiced ? new Date() : null,
      status,
      updatedById,
    },
  });
}
