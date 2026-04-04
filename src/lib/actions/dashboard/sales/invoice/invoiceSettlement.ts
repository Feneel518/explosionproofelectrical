"use server";

import { Prisma } from "@prisma/client";

type RollbackInvoiceEffectsArgs = {
  invoiceId: string;
  salesOrderId: string | null;
  rollbackSalesOrder?: boolean;
};

type RefreshSalesOrderInvoiceProgressArgs = {
  salesOrderId: string;
  updatedById: string | null;
};

export async function rollbackInvoiceEffects(
  tx: Prisma.TransactionClient,
  { invoiceId, salesOrderId, rollbackSalesOrder = true }: RollbackInvoiceEffectsArgs,
) {
  const existingInvoiceItems = await tx.invoiceItem.findMany({
    where: { invoiceId },
    select: {
      salesOrderItemId: true,
      qty: true,
    },
  });

  if (rollbackSalesOrder && salesOrderId) {
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
    const touchedRawMaterialIds = new Set<string>();
    const touchedVariantIds = new Set<string>();
    const touchedCastingIds = new Set<string>();

    for (const row of existingLedgerRows) {
      if (row.rawMaterialId) touchedRawMaterialIds.add(row.rawMaterialId);
      if (row.productVariantId) touchedVariantIds.add(row.productVariantId);
      if (row.castingMasterId) touchedCastingIds.add(row.castingMasterId);
    }

    await tx.stockLedger.deleteMany({
      where: {
        referenceType: "INVOICE",
        referenceId: invoiceId,
      },
    });

    for (const rawMaterialId of touchedRawMaterialIds) {
      const [rawMaterial, ledgerAgg, latestLedger, existingBalance] = await Promise.all([
        tx.rawMaterial.findUnique({
          where: { id: rawMaterialId },
          select: { openingStockQty: true },
        }),
        tx.stockLedger.aggregate({
          where: { rawMaterialId },
          _sum: { qtyIn: true, qtyOut: true },
        }),
        tx.stockLedger.findFirst({
          where: { rawMaterialId },
          orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
          select: { movementDate: true },
        }),
        tx.stockBalance.findFirst({
          where: { rawMaterialId },
          select: { id: true, qtyReserved: true },
        }),
      ]);

      const openingQty = Number(rawMaterial?.openingStockQty || 0);
      const qtyIn = Number(ledgerAgg._sum.qtyIn || 0);
      const qtyOut = Number(ledgerAgg._sum.qtyOut || 0);
      const qtyOnHand = openingQty + qtyIn - qtyOut;
      const qtyReserved = Number(existingBalance?.qtyReserved || 0);
      const qtyAvailable = qtyOnHand - qtyReserved;
      const lastMovementAt = latestLedger?.movementDate ?? null;

      if (existingBalance) {
        await tx.stockBalance.update({
          where: { id: existingBalance.id },
          data: {
            qtyOnHand,
            qtyAvailable,
            lastMovementAt,
          },
        });
      } else if (qtyOnHand !== 0 || qtyReserved !== 0 || lastMovementAt) {
        await tx.stockBalance.create({
          data: {
            rawMaterialId,
            productVariantId: null,
            castingMasterId: null,
            qtyOnHand,
            qtyReserved,
            qtyAvailable,
            lastMovementAt,
          },
        });
      }
    }

    for (const productVariantId of touchedVariantIds) {
      const [ledgerAgg, latestLedger, existingBalance] = await Promise.all([
        tx.stockLedger.aggregate({
          where: { productVariantId },
          _sum: { qtyIn: true, qtyOut: true },
        }),
        tx.stockLedger.findFirst({
          where: { productVariantId },
          orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
          select: { movementDate: true },
        }),
        tx.stockBalance.findFirst({
          where: { productVariantId },
          select: { id: true, qtyReserved: true },
        }),
      ]);

      const qtyIn = Number(ledgerAgg._sum.qtyIn || 0);
      const qtyOut = Number(ledgerAgg._sum.qtyOut || 0);
      const qtyOnHand = qtyIn - qtyOut;
      const qtyReserved = Number(existingBalance?.qtyReserved || 0);
      const qtyAvailable = qtyOnHand - qtyReserved;
      const lastMovementAt = latestLedger?.movementDate ?? null;

      if (existingBalance) {
        await tx.stockBalance.update({
          where: { id: existingBalance.id },
          data: {
            qtyOnHand,
            qtyAvailable,
            lastMovementAt,
          },
        });
      } else if (qtyOnHand !== 0 || qtyReserved !== 0 || lastMovementAt) {
        await tx.stockBalance.create({
          data: {
            rawMaterialId: null,
            productVariantId,
            castingMasterId: null,
            qtyOnHand,
            qtyReserved,
            qtyAvailable,
            lastMovementAt,
          },
        });
      }
    }

    for (const castingMasterId of touchedCastingIds) {
      const [castingMaster, ledgerAgg, latestLedger, existingBalance] = await Promise.all([
        tx.castingMaster.findUnique({
          where: { id: castingMasterId },
          select: { openingStockQty: true },
        }),
        tx.stockLedger.aggregate({
          where: { castingMasterId },
          _sum: { qtyIn: true, qtyOut: true },
        }),
        tx.stockLedger.findFirst({
          where: { castingMasterId },
          orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
          select: { movementDate: true },
        }),
        tx.stockBalance.findFirst({
          where: { castingMasterId },
          select: { id: true, qtyReserved: true },
        }),
      ]);

      const openingQty = Number(castingMaster?.openingStockQty || 0);
      const qtyIn = Number(ledgerAgg._sum.qtyIn || 0);
      const qtyOut = Number(ledgerAgg._sum.qtyOut || 0);
      const qtyOnHand = openingQty + qtyIn - qtyOut;
      const qtyReserved = Number(existingBalance?.qtyReserved || 0);
      const qtyAvailable = qtyOnHand - qtyReserved;
      const lastMovementAt = latestLedger?.movementDate ?? null;

      if (existingBalance) {
        await tx.stockBalance.update({
          where: { id: existingBalance.id },
          data: {
            qtyOnHand,
            qtyAvailable,
            lastMovementAt,
          },
        });
      } else if (qtyOnHand !== 0 || qtyReserved !== 0 || lastMovementAt) {
        await tx.stockBalance.create({
          data: {
            rawMaterialId: null,
            productVariantId: null,
            castingMasterId,
            qtyOnHand,
            qtyReserved,
            qtyAvailable,
            lastMovementAt,
          },
        });
      }
    }
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
