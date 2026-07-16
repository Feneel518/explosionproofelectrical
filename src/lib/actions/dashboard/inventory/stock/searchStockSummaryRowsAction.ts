"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

const DEFAULT_TAKE = 40;
const MIN_TAKE = 10;
const MAX_TAKE = 100;

export type StockSummaryListItem = {
  id: string;
  itemType: "RAW_MATERIAL" | "FINISHED_GOOD" | "CASTING";
  title: string;
  subtitle: string | null;
  meta: string | null;
  itemHref: string | null;
  qtyOnHand: number;
  qtyAvailable: number;
  openingQty: number;
  monthInQty: number;
  monthOutQty: number;
  consumedQty: number;
  lastMovementAt: string | null;
  lastMovementType: string | null;
  lastMovementQtyIn: number | null;
  lastMovementQtyOut: number | null;
  lastReferenceLabel: string | null;
  lastReferenceHref: string | null;
  lastReferenceSubtext: string | null;
};

type SearchStockSummaryRowsArgs = {
  query?: string;
  cursor?: string | null;
  take?: number;
};

export async function searchStockSummaryRowsAction({
  query = "",
  cursor = null,
  take = DEFAULT_TAKE,
}: SearchStockSummaryRowsArgs): Promise<{
  items: StockSummaryListItem[];
  nextCursor: string | null;
}> {
  await requireAuth();

  const q = (query ?? "").trim();
  const takeQty = Math.min(Math.max(take ?? DEFAULT_TAKE, MIN_TAKE), MAX_TAKE);

  const rows = await prisma.stockBalance.findMany({
    take: takeQty + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    where: q
      ? {
          OR: [
            {
              rawMaterial: {
                is: {
                  OR: [
                    { companyItemName: { contains: q, mode: "insensitive" } },
                    { supplierItemName: { contains: q, mode: "insensitive" } },
                    { itemCode: { contains: q, mode: "insensitive" } },
                    { hsnCode: { contains: q, mode: "insensitive" } },
                    { unit: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              productVariant: {
                is: {
                  OR: [
                    { variant: { contains: q, mode: "insensitive" } },
                    { sku: { contains: q, mode: "insensitive" } },
                    { typeNumber: { contains: q, mode: "insensitive" } },
                    {
                      product: {
                        name: { contains: q, mode: "insensitive" },
                      },
                    },
                  ],
                },
              },
            },
            {
              castingMaster: {
                is: {
                  OR: [
                    { castingItemName: { contains: q, mode: "insensitive" } },
                    { castingCode: { contains: q, mode: "insensitive" } },
                    { drawingNumber: { contains: q, mode: "insensitive" } },
                    { hsnCode: { contains: q, mode: "insensitive" } },
                    { unit: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : undefined,
    include: {
      rawMaterial: {
        select: {
          id: true,
          companyItemName: true,
          supplierItemName: true,
          itemCode: true,
          hsnCode: true,
          unit: true,
        },
      },
      productVariant: {
        select: {
          id: true,
          variant: true,
          sku: true,
          typeNumber: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
      castingMaster: {
        select: {
          id: true,
          castingItemName: true,
          castingCode: true,
          drawingNumber: true,
          hsnCode: true,
          unit: true,
        },
      },
    },
  });

  const hasMore = rows.length > takeQty;
  const sliced = hasMore ? rows.slice(0, takeQty) : rows;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const rawMaterialIds = sliced
    .map((row) => row.rawMaterial?.id ?? null)
    .filter((id): id is string => Boolean(id));
  const variantIds = sliced
    .map((row) => row.productVariant?.id ?? null)
    .filter((id): id is string => Boolean(id));
  const castingIds = sliced
    .map((row) => row.castingMaster?.id ?? null)
    .filter((id): id is string => Boolean(id));

  const movementWhereOr: Array<Record<string, unknown>> = [];
  if (rawMaterialIds.length > 0) {
    movementWhereOr.push({ rawMaterialId: { in: rawMaterialIds } });
  }
  if (variantIds.length > 0) {
    movementWhereOr.push({ productVariantId: { in: variantIds } });
  }
  if (castingIds.length > 0) {
    movementWhereOr.push({ castingMasterId: { in: castingIds } });
  }

  const [
    rawMaterialConsumption,
    variantConsumption,
    castingConsumption,
    rawMaterialMtdMovements,
    variantMtdMovements,
    castingMtdMovements,
    latestMovements,
  ] = await Promise.all([
    rawMaterialIds.length > 0
      ? prisma.stockLedger.groupBy({
          by: ["rawMaterialId"],
          where: { rawMaterialId: { in: rawMaterialIds } },
          _sum: { qtyOut: true },
        })
      : Promise.resolve([]),
    variantIds.length > 0
      ? prisma.stockLedger.groupBy({
          by: ["productVariantId"],
          where: { productVariantId: { in: variantIds } },
          _sum: { qtyOut: true },
        })
      : Promise.resolve([]),
    castingIds.length > 0
      ? prisma.stockLedger.groupBy({
          by: ["castingMasterId"],
          where: { castingMasterId: { in: castingIds } },
          _sum: { qtyOut: true },
        })
      : Promise.resolve([]),
    rawMaterialIds.length > 0
      ? prisma.stockLedger.groupBy({
          by: ["rawMaterialId"],
          where: {
            rawMaterialId: { in: rawMaterialIds },
            movementDate: { gte: monthStart, lt: nextMonthStart },
          },
          _sum: { qtyIn: true, qtyOut: true },
        })
      : Promise.resolve([]),
    variantIds.length > 0
      ? prisma.stockLedger.groupBy({
          by: ["productVariantId"],
          where: {
            productVariantId: { in: variantIds },
            movementDate: { gte: monthStart, lt: nextMonthStart },
          },
          _sum: { qtyIn: true, qtyOut: true },
        })
      : Promise.resolve([]),
    castingIds.length > 0
      ? prisma.stockLedger.groupBy({
          by: ["castingMasterId"],
          where: {
            castingMasterId: { in: castingIds },
            movementDate: { gte: monthStart, lt: nextMonthStart },
          },
          _sum: { qtyIn: true, qtyOut: true },
        })
      : Promise.resolve([]),
    movementWhereOr.length > 0
      ? prisma.stockLedger.findMany({
          where: { OR: movementWhereOr },
          orderBy: [{ createdAt: "desc" }, { movementDate: "desc" }],
          select: {
            createdAt: true,
            movementDate: true,
            movementType: true,
            referenceType: true,
            referenceId: true,
            referenceNo: true,
            rawMaterialId: true,
            productVariantId: true,
            castingMasterId: true,
            qtyIn: true,
            qtyOut: true,
          },
          take: 4000,
        })
      : Promise.resolve([]),
  ]);

  const consumedByRawMaterialId = new Map(
    rawMaterialConsumption.flatMap((row) => row.rawMaterialId
      ? [[row.rawMaterialId, Number(row._sum.qtyOut ?? 0)] as const]
      : []),
  );
  const consumedByVariantId = new Map(
    variantConsumption.flatMap((row) => row.productVariantId
      ? [[row.productVariantId, Number(row._sum.qtyOut ?? 0)] as const]
      : []),
  );
  const consumedByCastingId = new Map(
    castingConsumption.flatMap((row) => row.castingMasterId
      ? [[row.castingMasterId, Number(row._sum.qtyOut ?? 0)] as const]
      : []),
  );

  const mtdByRawMaterialId = new Map(
    rawMaterialMtdMovements.flatMap((row) => row.rawMaterialId
      ? [[row.rawMaterialId, { qtyIn: Number(row._sum.qtyIn ?? 0), qtyOut: Number(row._sum.qtyOut ?? 0) }] as const]
      : []),
  );
  const mtdByVariantId = new Map(
    variantMtdMovements.flatMap((row) => row.productVariantId
      ? [[row.productVariantId, { qtyIn: Number(row._sum.qtyIn ?? 0), qtyOut: Number(row._sum.qtyOut ?? 0) }] as const]
      : []),
  );
  const mtdByCastingId = new Map(
    castingMtdMovements.flatMap((row) => row.castingMasterId
      ? [[row.castingMasterId, { qtyIn: Number(row._sum.qtyIn ?? 0), qtyOut: Number(row._sum.qtyOut ?? 0) }] as const]
      : []),
  );

  const latestByItemKey = new Map<
    string,
    {
      postedAt: Date;
      movementType: string;
      referenceType: string;
      referenceId: string;
      referenceNo: string | null;
      qtyIn: number;
      qtyOut: number;
    }
  >();

  for (const movement of latestMovements) {
    const itemKey = movement.rawMaterialId
      ? `RM:${movement.rawMaterialId}`
      : movement.productVariantId
        ? `PV:${movement.productVariantId}`
        : movement.castingMasterId
          ? `CM:${movement.castingMasterId}`
          : null;
    if (!itemKey || latestByItemKey.has(itemKey)) continue;

    latestByItemKey.set(itemKey, {
      postedAt: movement.createdAt,
      movementType: movement.movementType,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      referenceNo: movement.referenceNo ?? null,
      qtyIn: Number(movement.qtyIn),
      qtyOut: Number(movement.qtyOut),
    });
  }

  const issueIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "MATERIAL_ISSUE")
        .map((row) => row.referenceId),
    ),
  );
  const adjustmentIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "MANUAL_ADJUSTMENT")
        .map((row) => row.referenceId),
    ),
  );
  const castingJobIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "CASTING_JOB")
        .map((row) => row.referenceId),
    ),
  );
  const invoiceIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "INVOICE")
        .map((row) => row.referenceId),
    ),
  );
  const deliveryChallanIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "DELIVERY_CHALLAN")
        .map((row) => row.referenceId),
    ),
  );

  const [
    issueMeta,
    adjustmentMeta,
    castingJobMeta,
    invoiceMeta,
    deliveryChallanMeta,
  ] = await Promise.all([
    issueIds.length > 0
      ? prisma.materialIssue.findMany({
          where: { id: { in: issueIds } },
          select: {
            id: true,
            issueType: true,
            issuedToNameSnapshot: true,
            directSaleCustomerNameSnapshot: true,
          },
        })
      : Promise.resolve([]),
    adjustmentIds.length > 0
      ? prisma.stockAdjustment.findMany({
          where: { id: { in: adjustmentIds } },
          select: {
            id: true,
            reason: true,
            adjustedByNameSnapshot: true,
          },
        })
      : Promise.resolve([]),
    castingJobIds.length > 0
      ? prisma.castingJob.findMany({
          where: { id: { in: castingJobIds } },
          select: {
            id: true,
            workerType: true,
            workerNameSnapshot: true,
          },
        })
      : Promise.resolve([]),
    invoiceIds.length > 0
      ? prisma.invoice.findMany({
          where: { id: { in: invoiceIds } },
          select: {
            id: true,
            clientNameSnapshot: true,
          },
        })
      : Promise.resolve([]),
    deliveryChallanIds.length > 0
      ? prisma.deliveryChallan.findMany({
          where: { id: { in: deliveryChallanIds } },
          select: {
            id: true,
            customer: {
              select: {
                companyName: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const issueMetaById = new Map(issueMeta.map((row) => [row.id, row]));
  const adjustmentMetaById = new Map(adjustmentMeta.map((row) => [row.id, row]));
  const castingJobMetaById = new Map(castingJobMeta.map((row) => [row.id, row]));
  const invoiceMetaById = new Map(invoiceMeta.map((row) => [row.id, row]));
  const deliveryChallanMetaById = new Map(
    deliveryChallanMeta.map((row) => [row.id, row]),
  );

  const items: StockSummaryListItem[] = sliced.map((row) => {
    const isRawMaterial = Boolean(row.rawMaterial);
    const isCasting = Boolean(row.castingMaster);
    const isFinishedGood = Boolean(row.productVariant);

    const itemType: StockSummaryListItem["itemType"] = isRawMaterial
      ? "RAW_MATERIAL"
      : isCasting
        ? "CASTING"
        : "FINISHED_GOOD";

    const title = isRawMaterial
      ? row.rawMaterial?.companyItemName || "-"
      : isCasting
        ? row.castingMaster?.castingItemName || "-"
        : [row.productVariant?.product.name, row.productVariant?.variant]
            .filter(Boolean)
            .join(" - ") || "-";

    const subtitle = isRawMaterial
      ? row.rawMaterial?.supplierItemName
        ? `Supplier: ${row.rawMaterial.supplierItemName}`
        : null
      : isCasting
        ? "Casting Master"
        : isFinishedGood
          ? "Finished Good"
          : null;

    const meta = isRawMaterial
      ? [row.rawMaterial?.itemCode, row.rawMaterial?.hsnCode, row.rawMaterial?.unit]
          .filter(Boolean)
          .join(" • ")
      : isCasting
        ? [
            row.castingMaster?.castingCode,
            row.castingMaster?.drawingNumber,
            row.castingMaster?.hsnCode,
            row.castingMaster?.unit,
          ]
            .filter(Boolean)
            .join(" • ")
        : [row.productVariant?.sku, row.productVariant?.typeNumber]
            .filter(Boolean)
            .join(" • ");

    const itemHref = isRawMaterial && row.rawMaterial?.id
      ? `/dashboard/raw-materials/${row.rawMaterial.id}`
      : isCasting && row.castingMaster?.id
        ? `/dashboard/casting-masters/${row.castingMaster.id}`
        : null;

    const itemKey = isRawMaterial
      ? `RM:${row.rawMaterial?.id ?? ""}`
      : isCasting
        ? `CM:${row.castingMaster?.id ?? ""}`
        : `PV:${row.productVariant?.id ?? ""}`;

    const consumedQty = isRawMaterial
      ? consumedByRawMaterialId.get(row.rawMaterial?.id ?? "") ?? 0
      : isCasting
        ? consumedByCastingId.get(row.castingMaster?.id ?? "") ?? 0
        : consumedByVariantId.get(row.productVariant?.id ?? "") ?? 0;

    const monthMovement = isRawMaterial
      ? mtdByRawMaterialId.get(row.rawMaterial?.id ?? "") ?? { qtyIn: 0, qtyOut: 0 }
      : isCasting
        ? mtdByCastingId.get(row.castingMaster?.id ?? "") ?? { qtyIn: 0, qtyOut: 0 }
        : mtdByVariantId.get(row.productVariant?.id ?? "") ?? { qtyIn: 0, qtyOut: 0 };

    const qtyOnHand = Number(row.qtyOnHand);
    const qtyAvailable = Number(row.qtyAvailable);
    const openingQty = qtyOnHand - monthMovement.qtyIn + monthMovement.qtyOut;
    const latestMovement = latestByItemKey.get(itemKey);

    let lastReferenceHref: string | null = null;
    let lastReferenceSubtext: string | null = null;
    const lastReferenceLabel =
      latestMovement?.referenceNo || latestMovement?.referenceId || null;

    if (latestMovement?.referenceType === "GRN") {
      lastReferenceHref = `/dashboard/purchase/grn/${latestMovement.referenceId}`;
    } else if (latestMovement?.referenceType === "MATERIAL_ISSUE") {
      lastReferenceHref = `/dashboard/manufacturing/material-issues/${latestMovement.referenceId}`;
      const issue = issueMetaById.get(latestMovement.referenceId);
      if (issue) {
        lastReferenceSubtext =
          issue.issueType === "DIRECT_SALE"
            ? `Direct Sale • ${issue.directSaleCustomerNameSnapshot || issue.issuedToNameSnapshot || "-"}`
            : `Internal Use • ${issue.issuedToNameSnapshot || "-"}`;
      }
    } else if (latestMovement?.referenceType === "MATERIAL_RETURN") {
      lastReferenceHref = "/dashboard/inventory/returns";
      lastReferenceSubtext = "Employee material return";
    } else if (latestMovement?.referenceType === "CASTING_JOB") {
      lastReferenceHref = `/dashboard/manufacturing/casting-jobs/${latestMovement.referenceId}`;
      const castingJob = castingJobMetaById.get(latestMovement.referenceId);
      if (castingJob) {
        lastReferenceSubtext = `Casting Job • ${castingJob.workerNameSnapshot || "-"} (${castingJob.workerType || "-"})`;
      }
    } else if (latestMovement?.referenceType === "INVOICE") {
      lastReferenceHref = `/dashboard/sales/invoices/${latestMovement.referenceId}`;
      const invoice = invoiceMetaById.get(latestMovement.referenceId);
      if (invoice) {
        lastReferenceSubtext = `Invoice • ${invoice.clientNameSnapshot || "-"}`;
      }
    } else if (latestMovement?.referenceType === "DELIVERY_CHALLAN") {
      lastReferenceHref = `/dashboard/sales/delivery-challans/${latestMovement.referenceId}`;
      const deliveryChallan = deliveryChallanMetaById.get(latestMovement.referenceId);
      if (deliveryChallan) {
        lastReferenceSubtext = `Delivery Challan • ${deliveryChallan.customer?.companyName || "-"}`;
      }
    } else if (
      latestMovement?.referenceType === "MANUAL_ADJUSTMENT" &&
      adjustmentMetaById.has(latestMovement.referenceId)
    ) {
      lastReferenceHref = `/dashboard/inventory/adjustments/${latestMovement.referenceId}`;
      const adjustment = adjustmentMetaById.get(latestMovement.referenceId);
      if (adjustment) {
        lastReferenceSubtext = `Manual Adjust • ${adjustment.reason || adjustment.adjustedByNameSnapshot || "-"}`;
      }
    }

    return {
      id: row.id,
      itemType,
      title,
      subtitle,
      meta: meta || null,
      itemHref,
      qtyOnHand,
      qtyAvailable,
      openingQty,
      monthInQty: monthMovement.qtyIn,
      monthOutQty: monthMovement.qtyOut,
      consumedQty,
      lastMovementAt: latestMovement?.postedAt.toISOString() ?? null,
      lastMovementType: latestMovement?.movementType ?? null,
      lastMovementQtyIn: latestMovement?.qtyIn ?? null,
      lastMovementQtyOut: latestMovement?.qtyOut ?? null,
      lastReferenceLabel,
      lastReferenceHref,
      lastReferenceSubtext,
    };
  });

  return {
    items,
    nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null,
  };
}
