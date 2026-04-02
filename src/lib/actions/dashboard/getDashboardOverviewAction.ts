"use server";

import { prisma } from "@/lib/prisma/db";
import { getPaymentReminderState } from "@/lib/helpers/globalHelpers/invoicePaymentReminder";

function toNumber(value: unknown) {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export type DashboardOverviewData = {
  generatedAt: string;
  masters: {
    customers: { total: number; active: number };
    suppliers: { total: number; active: number };
    products: { total: number; active: number };
    rawMaterials: { total: number; active: number };
  };
  sales: {
    quotations: {
      total: number;
      open: number;
      won: number;
      lostOrClosed: number;
      followupDue: number;
    };
    orders: {
      total: number;
      open: number;
      pendingDispatchOrders: number;
      pendingDispatchQty: number;
      overdueForDispatch: number;
      bookedValue: number;
    };
    invoices: {
      total: number;
      draft: number;
      finalized: number;
      cancelled: number;
      paymentPendingCount: number;
      paymentPendingAmount: number;
      overduePaymentCount: number;
      dueTodayPaymentCount: number;
    };
  };
  purchase: {
    grn: {
      total: number;
      draft: number;
      finalized: number;
      cancelled: number;
      pendingQualityChecks: number;
      discrepancies: number;
      receivedQtyThisMonth: number;
    };
  };
  manufacturing: {
    materialIssue: {
      total: number;
      draft: number;
      finalized: number;
      cancelled: number;
      internalUse: number;
      directSale: number;
      qtyIssuedThisMonth: number;
      qtyReturnedThisMonth: number;
    };
    castingJob: {
      total: number;
      inProgress: number;
      partialReceived: number;
      closed: number;
      pendingWeightKg: number;
      receivedWeightKgThisMonth: number;
    };
  };
  inventory: {
    stock: {
      trackedItems: number;
      lowStockThreshold: number;
      lowStockItems: number;
      negativeStockItems: number;
      totalOnHand: number;
      totalReserved: number;
      totalAvailable: number;
      lastMovementAt: string | null;
      movementInThisMonth: number;
      movementOutThisMonth: number;
    };
  };
};

export async function getDashboardOverviewAction(): Promise<DashboardOverviewData> {
  const startOfMonth = getStartOfMonth();
  const now = new Date();

  const [
    customerTotal,
    customerActive,
    supplierTotal,
    supplierActive,
    productTotal,
    productActive,
    rawMaterialTotal,
    rawMaterialActive,

    quotationTotal,
    quotationOpen,
    quotationWon,
    quotationLostOrClosed,
    quotationFollowupDue,

    orderTotal,
    orderOpen,
    orderPendingDispatch,
    orderPendingQtyAgg,
    orderOverdueDispatch,
    orderBookedValueAgg,

    invoiceTotal,
    invoiceDraft,
    invoiceFinalized,
    invoiceCancelled,
    invoicePaymentPendingCount,
    invoicePaymentPendingAmountAgg,

    pendingPaymentInvoices,

    grnTotal,
    grnDraft,
    grnFinalized,
    grnCancelled,
    grnPendingChecks,
    grnDiscrepancies,
    grnReceivedQtyThisMonthAgg,

    materialIssueTotal,
    materialIssueDraft,
    materialIssueFinalized,
    materialIssueCancelled,
    materialIssueInternalUse,
    materialIssueDirectSale,
    materialIssuedThisMonthAgg,
    materialReturnedThisMonthAgg,
    castingJobTotal,
    castingJobInProgress,
    castingJobPartialReceived,
    castingJobClosed,
    castingJobPendingWeightAgg,
    castingJobReceiptWeightThisMonthAgg,

    inventorySetting,
    stockTrackedItems,
    stockLowItemsZeroThreshold,
    stockNegativeItems,
    stockBalanceAgg,
    lastStockMovement,
    stockMovementThisMonthAgg,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.supplier.count({ where: { deletedAt: null } }),
    prisma.supplier.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.rawMaterial.count({ where: { deletedAt: null } }),
    prisma.rawMaterial.count({ where: { deletedAt: null, status: "ACTIVE" } }),

    prisma.quotation.count({ where: { deletedAt: null } }),
    prisma.quotation.count({
      where: { deletedAt: null, status: { in: ["DRAFT", "SENT", "FOLLOWUP"] } },
    }),
    prisma.quotation.count({ where: { deletedAt: null, status: "WON" } }),
    prisma.quotation.count({
      where: { deletedAt: null, status: { in: ["LOST", "EXPIRED", "CANCELLED"] } },
    }),
    prisma.quotation.count({
      where: {
        deletedAt: null,
        status: { in: ["DRAFT", "SENT", "FOLLOWUP"] },
        nextFollowupAt: { lte: now },
      },
    }),

    prisma.salesOrder.count({ where: { deletedAt: null } }),
    prisma.salesOrder.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
    }),
    prisma.salesOrder.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        totalPendingQty: { gt: 0 },
      },
    }),
    prisma.salesOrder.aggregate({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        totalPendingQty: { gt: 0 },
      },
      _sum: { totalPendingQty: true },
    }),
    prisma.salesOrder.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        isOverdueForDispatch: true,
      },
    }),
    prisma.salesOrder.aggregate({
      where: { deletedAt: null, status: { not: "CANCELLED" } },
      _sum: { grandTotal: true },
    }),

    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: "DRAFT" } }),
    prisma.invoice.count({ where: { status: "FINALIZED" } }),
    prisma.invoice.count({ where: { status: "CANCELLED" } }),
    prisma.invoice.count({
      where: { status: "FINALIZED", paymentReceived: false },
    }),
    prisma.invoice.aggregate({
      where: { status: "FINALIZED", paymentReceived: false },
      _sum: { grandTotal: true },
    }),

    prisma.invoice.findMany({
      where: { status: "FINALIZED", paymentReceived: false },
      select: {
        invoiceDate: true,
        dispatchDate: true,
        salesOrder: {
          select: {
            paymentTerms: true,
          },
        },
      },
    }),

    prisma.goodsReceiptNote.count(),
    prisma.goodsReceiptNote.count({ where: { status: "DRAFT" } }),
    prisma.goodsReceiptNote.count({ where: { status: "FINALIZED" } }),
    prisma.goodsReceiptNote.count({ where: { status: "CANCELLED" } }),
    prisma.goodsReceiptNote.count({
      where: {
        status: "FINALIZED",
        OR: [
          { materialCheckStatus: "PENDING" },
          { quantityCheckStatus: "PENDING" },
        ],
      },
    }),
    prisma.goodsReceiptNote.count({
      where: {
        status: "FINALIZED",
        OR: [
          { materialCheckStatus: "CHECKED_NOT_OK" },
          { quantityCheckStatus: "MISMATCH" },
        ],
      },
    }),
    prisma.goodsReceiptNoteItem.aggregate({
      where: {
        grn: {
          status: "FINALIZED",
          receivedAt: { gte: startOfMonth },
        },
      },
      _sum: { qty: true },
    }),

    prisma.materialIssue.count(),
    prisma.materialIssue.count({ where: { status: "DRAFT" } }),
    prisma.materialIssue.count({ where: { status: "FINALIZED" } }),
    prisma.materialIssue.count({ where: { status: "CANCELLED" } }),
    prisma.materialIssue.count({ where: { issueType: "INTERNAL_USE" } }),
    prisma.materialIssue.count({ where: { issueType: "DIRECT_SALE" } }),
    prisma.materialIssueItem.aggregate({
      where: {
        materialIssue: {
          status: "FINALIZED",
          issueDate: { gte: startOfMonth },
        },
      },
      _sum: { qtyIssued: true },
    }),
    prisma.materialIssueItem.aggregate({
      where: {
        materialIssue: {
          status: "FINALIZED",
          issueDate: { gte: startOfMonth },
        },
      },
      _sum: { qtyReturned: true },
    }),

    prisma.castingJob.count(),
    prisma.castingJob.count({
      where: { status: "IN_PROGRESS" },
    }),
    prisma.castingJob.count({
      where: { status: "PARTIAL_RECEIVED" },
    }),
    prisma.castingJob.count({
      where: { status: "CLOSED" },
    }),
    prisma.castingJob.aggregate({
      where: { status: { in: ["IN_PROGRESS", "PARTIAL_RECEIVED"] } },
      _sum: { totalPendingWeightKg: true },
    }),
    prisma.castingJobReceiptItem.aggregate({
      where: {
        castingJobReceipt: {
          receivedAt: { gte: startOfMonth },
        },
      },
      _sum: { receivedWeightKg: true },
    }),

    prisma.inventorySetting.findUnique({
      where: { id: "default" },
      select: { lowStockThreshold: true },
    }),
    prisma.stockBalance.count(),
    prisma.stockBalance.count({ where: { qtyAvailable: { lte: 0 } } }),
    prisma.stockBalance.count({ where: { qtyAvailable: { lt: 0 } } }),
    prisma.stockBalance.aggregate({
      _sum: { qtyOnHand: true, qtyReserved: true, qtyAvailable: true },
    }),
    prisma.stockLedger.findFirst({
      orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
      select: { movementDate: true },
    }),
    prisma.stockLedger.aggregate({
      where: { movementDate: { gte: startOfMonth } },
      _sum: { qtyIn: true, qtyOut: true },
    }),
  ]);

  let overduePaymentCount = 0;
  let dueTodayPaymentCount = 0;

  for (const invoice of pendingPaymentInvoices) {
    const state = getPaymentReminderState({
      paymentTerms: invoice.salesOrder.paymentTerms,
      invoiceDate: invoice.invoiceDate,
      dispatchDate: invoice.dispatchDate,
      paymentReceived: false,
    });

    if (state.isOverdue) overduePaymentCount += 1;
    if (state.isDueToday) dueTodayPaymentCount += 1;
  }

  const lowStockThreshold = inventorySetting?.lowStockThreshold ?? 0;
  const lowStockItems =
    lowStockThreshold <= 0
      ? stockLowItemsZeroThreshold
      : await prisma.stockBalance.count({
          where: { qtyAvailable: { lte: lowStockThreshold } },
        });

  return {
    generatedAt: now.toISOString(),
    masters: {
      customers: { total: customerTotal, active: customerActive },
      suppliers: { total: supplierTotal, active: supplierActive },
      products: { total: productTotal, active: productActive },
      rawMaterials: { total: rawMaterialTotal, active: rawMaterialActive },
    },
    sales: {
      quotations: {
        total: quotationTotal,
        open: quotationOpen,
        won: quotationWon,
        lostOrClosed: quotationLostOrClosed,
        followupDue: quotationFollowupDue,
      },
      orders: {
        total: orderTotal,
        open: orderOpen,
        pendingDispatchOrders: orderPendingDispatch,
        pendingDispatchQty: orderPendingQtyAgg._sum.totalPendingQty ?? 0,
        overdueForDispatch: orderOverdueDispatch,
        bookedValue: toNumber(orderBookedValueAgg._sum.grandTotal),
      },
      invoices: {
        total: invoiceTotal,
        draft: invoiceDraft,
        finalized: invoiceFinalized,
        cancelled: invoiceCancelled,
        paymentPendingCount: invoicePaymentPendingCount,
        paymentPendingAmount: toNumber(invoicePaymentPendingAmountAgg._sum.grandTotal),
        overduePaymentCount,
        dueTodayPaymentCount,
      },
    },
    purchase: {
      grn: {
        total: grnTotal,
        draft: grnDraft,
        finalized: grnFinalized,
        cancelled: grnCancelled,
        pendingQualityChecks: grnPendingChecks,
        discrepancies: grnDiscrepancies,
        receivedQtyThisMonth: grnReceivedQtyThisMonthAgg._sum.qty ?? 0,
      },
    },
    manufacturing: {
      materialIssue: {
        total: materialIssueTotal,
        draft: materialIssueDraft,
        finalized: materialIssueFinalized,
        cancelled: materialIssueCancelled,
        internalUse: materialIssueInternalUse,
        directSale: materialIssueDirectSale,
        qtyIssuedThisMonth: materialIssuedThisMonthAgg._sum.qtyIssued ?? 0,
        qtyReturnedThisMonth: materialReturnedThisMonthAgg._sum.qtyReturned ?? 0,
      },
      castingJob: {
        total: castingJobTotal,
        inProgress: castingJobInProgress,
        partialReceived: castingJobPartialReceived,
        closed: castingJobClosed,
        pendingWeightKg: toNumber(castingJobPendingWeightAgg._sum.totalPendingWeightKg),
        receivedWeightKgThisMonth: toNumber(
          castingJobReceiptWeightThisMonthAgg._sum.receivedWeightKg,
        ),
      },
    },
    inventory: {
      stock: {
        trackedItems: stockTrackedItems,
        lowStockThreshold,
        lowStockItems,
        negativeStockItems: stockNegativeItems,
        totalOnHand: stockBalanceAgg._sum.qtyOnHand ?? 0,
        totalReserved: stockBalanceAgg._sum.qtyReserved ?? 0,
        totalAvailable: stockBalanceAgg._sum.qtyAvailable ?? 0,
        lastMovementAt: lastStockMovement?.movementDate
          ? lastStockMovement.movementDate.toISOString()
          : null,
        movementInThisMonth: stockMovementThisMonthAgg._sum.qtyIn ?? 0,
        movementOutThisMonth: stockMovementThisMonthAgg._sum.qtyOut ?? 0,
      },
    },
  };
}
