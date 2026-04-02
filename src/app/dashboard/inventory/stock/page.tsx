import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

function formatDateTime(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function Page() {
  const [settings, balances] = await Promise.all([
    prisma.inventorySetting.findUnique({
      where: { id: "default" },
      select: { lowStockThreshold: true },
    }),
    prisma.stockBalance.findMany({
      orderBy: [{ qtyAvailable: "asc" }, { updatedAt: "desc" }],
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
                id: true,
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
      take: 500,
    }),
  ]);

  const threshold = settings?.lowStockThreshold ?? 0;
  const totalOnHand = balances.reduce((sum, row) => sum + row.qtyOnHand, 0);
  const lowStockCount = balances.filter(
    (row) => row.qtyAvailable <= threshold,
  ).length;
  const rawMaterialCount = balances.filter((row) => Boolean(row.rawMaterial)).length;
  const finishedGoodCount = balances.filter((row) => Boolean(row.productVariant)).length;
  const castingCount = balances.filter((row) => Boolean(row.castingMaster)).length;

  const rawMaterialIds = balances
    .map((row) => row.rawMaterial?.id ?? null)
    .filter((id): id is string => Boolean(id));
  const variantIds = balances
    .map((row) => row.productVariant?.id ?? null)
    .filter((id): id is string => Boolean(id));
  const castingIds = balances
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

  const latestMovements =
    movementWhereOr.length > 0
      ? await prisma.stockLedger.findMany({
          where: {
            OR: movementWhereOr,
          },
          orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
          select: {
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
          take: 5000,
        })
      : [];

  const latestByItemKey = new Map<
    string,
    {
      movementDate: Date;
      movementType: string;
      referenceType: string;
      referenceId: string;
      referenceNo: string | null;
      qtyIn: number;
      qtyOut: number;
    }
  >();

  for (const movement of latestMovements) {
    const key = movement.rawMaterialId
      ? `RM:${movement.rawMaterialId}`
      : movement.productVariantId
        ? `PV:${movement.productVariantId}`
        : movement.castingMasterId
          ? `CM:${movement.castingMasterId}`
        : null;

    if (!key || latestByItemKey.has(key)) continue;

    latestByItemKey.set(key, {
      movementDate: movement.movementDate,
      movementType: movement.movementType,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      referenceNo: movement.referenceNo ?? null,
      qtyIn: movement.qtyIn,
      qtyOut: movement.qtyOut,
    });
  }

  const movementIssueIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "MATERIAL_ISSUE")
        .map((row) => row.referenceId),
    ),
  );

  const movementIssueMeta =
    movementIssueIds.length > 0
      ? await prisma.materialIssue.findMany({
          where: { id: { in: movementIssueIds } },
          select: {
            id: true,
            issueType: true,
            issuedToNameSnapshot: true,
            directSaleCustomerNameSnapshot: true,
          },
        })
      : [];

  const issueMetaById = new Map(movementIssueMeta.map((row) => [row.id, row]));

  const movementAdjustmentIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "MANUAL_ADJUSTMENT")
        .map((row) => row.referenceId),
    ),
  );

  const movementAdjustmentMeta =
    movementAdjustmentIds.length > 0
      ? await prisma.stockAdjustment.findMany({
          where: { id: { in: movementAdjustmentIds } },
          select: {
            id: true,
            reason: true,
            adjustedByNameSnapshot: true,
          },
        })
      : [];

  const adjustmentMetaById = new Map(
    movementAdjustmentMeta.map((row) => [row.id, row]),
  );

  const movementCastingJobIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "CASTING_JOB")
        .map((row) => row.referenceId),
    ),
  );

  const movementCastingJobMeta =
    movementCastingJobIds.length > 0
      ? await prisma.castingJob.findMany({
          where: { id: { in: movementCastingJobIds } },
          select: {
            id: true,
            workerType: true,
            workerNameSnapshot: true,
            status: true,
          },
        })
      : [];

  const castingJobMetaById = new Map(
    movementCastingJobMeta.map((row) => [row.id, row]),
  );

  const movementInvoiceIds = Array.from(
    new Set(
      latestMovements
        .filter((row) => row.referenceType === "INVOICE")
        .map((row) => row.referenceId),
    ),
  );

  const movementInvoiceMeta =
    movementInvoiceIds.length > 0
      ? await prisma.invoice.findMany({
          where: { id: { in: movementInvoiceIds } },
          select: {
            id: true,
            invoiceNo: true,
            invoiceFy: true,
            clientNameSnapshot: true,
          },
        })
      : [];

  const invoiceMetaById = new Map(
    movementInvoiceMeta.map((row) => [row.id, row]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock Summary</h1>
        <p className="text-sm text-muted-foreground">
          Live stock from ledger postings (GRN inward and material issue outward).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Tracked Items</div>
          <div className="text-2xl font-semibold">{balances.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Raw Materials</div>
          <div className="text-2xl font-semibold">{rawMaterialCount}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Finished Goods</div>
          <div className="text-2xl font-semibold">{finishedGoodCount}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Castings</div>
          <div className="text-2xl font-semibold">{castingCount}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Total On Hand</div>
          <div className="text-2xl font-semibold">{formatNumber(totalOnHand)}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">
            Low Stock ({"<="} {threshold})
          </div>
          <div className="text-2xl font-semibold">{lowStockCount}</div>
        </div>
      </div>

      <div className="rounded-xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Item</TableHead>
              <TableHead className="text-white">Code / HSN / Unit</TableHead>
              <TableHead className="text-white">On Hand</TableHead>
              <TableHead className="text-white">Reserved</TableHead>
              <TableHead className="text-white">Available</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Last Movement</TableHead>
              <TableHead className="text-white">Last Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground">
                  No stock balances found.
                </TableCell>
              </TableRow>
            ) : (
              balances.map((row) => {
                const isLow = row.qtyAvailable <= threshold;
                const isRawMaterial = Boolean(row.rawMaterial);
                const isCasting = Boolean(row.castingMaster);
                const isFinishedGood = Boolean(row.productVariant);

                const title = isRawMaterial
                  ? row.rawMaterial?.companyItemName || "-"
                  : isCasting
                    ? row.castingMaster?.castingItemName || "-"
                    : [row.productVariant?.product.name, row.productVariant?.variant]
                        .filter(Boolean)
                        .join(" - ") || "-";

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

                const itemKey = isRawMaterial
                  ? `RM:${row.rawMaterial?.id ?? ""}`
                  : isCasting
                    ? `CM:${row.castingMaster?.id ?? ""}`
                    : `PV:${row.productVariant?.id ?? ""}`;

                const latestMovement = latestByItemKey.get(itemKey);
                const movementIssue =
                  latestMovement?.referenceType === "MATERIAL_ISSUE"
                    ? issueMetaById.get(latestMovement.referenceId)
                    : null;

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        {isRawMaterial && row.rawMaterial?.id ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/raw-materials/${row.rawMaterial.id}`}
                          >
                            {title}
                          </Link>
                        ) : isCasting && row.castingMaster?.id ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/casting-masters/${row.castingMaster.id}`}
                          >
                            {title}
                          </Link>
                        ) : (
                          title
                        )}
                      </div>
                      {isRawMaterial && row.rawMaterial?.supplierItemName ? (
                        <div className="text-xs text-muted-foreground">
                          Supplier: {row.rawMaterial.supplierItemName}
                        </div>
                      ) : null}
                      {isCasting ? (
                        <div className="text-xs text-muted-foreground">Casting Master</div>
                      ) : null}
                      {isFinishedGood ? (
                        <div className="text-xs text-muted-foreground">Finished Good</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{meta || "-"}</TableCell>
                    <TableCell>{formatNumber(row.qtyOnHand)}</TableCell>
                    <TableCell>{formatNumber(row.qtyReserved)}</TableCell>
                    <TableCell>{formatNumber(row.qtyAvailable)}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive">LOW</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {latestMovement ? formatDateTime(latestMovement.movementDate) : "-"}
                      {latestMovement ? (
                        <div className="text-xs text-muted-foreground">
                          {latestMovement.movementType} • IN {latestMovement.qtyIn} / OUT{" "}
                          {latestMovement.qtyOut}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {latestMovement ? (
                        <>
                          <div className="text-sm">
                            {latestMovement.referenceType === "GRN" ? (
                              <Link
                                className="hover:underline"
                                href={`/dashboard/purchase/grn/${latestMovement.referenceId}`}>
                                {latestMovement.referenceNo || latestMovement.referenceId}
                              </Link>
                            ) : latestMovement.referenceType === "MATERIAL_ISSUE" ? (
                              <Link
                                className="hover:underline"
                                href={`/dashboard/manufacturing/material-issues/${latestMovement.referenceId}`}>
                                {latestMovement.referenceNo || latestMovement.referenceId}
                              </Link>
                            ) : latestMovement.referenceType === "CASTING_JOB" ? (
                              <Link
                                className="hover:underline"
                                href={`/dashboard/manufacturing/casting-jobs/${latestMovement.referenceId}`}>
                                {latestMovement.referenceNo || latestMovement.referenceId}
                              </Link>
                            ) : latestMovement.referenceType === "INVOICE" ? (
                              <Link
                                className="hover:underline"
                                href={`/dashboard/sales/invoices/${latestMovement.referenceId}`}>
                                {latestMovement.referenceNo || latestMovement.referenceId}
                              </Link>
                            ) : latestMovement.referenceType === "MANUAL_ADJUSTMENT" &&
                              adjustmentMetaById.has(latestMovement.referenceId) ? (
                              <Link
                                className="hover:underline"
                                href={`/dashboard/inventory/adjustments/${latestMovement.referenceId}`}>
                                {latestMovement.referenceNo || latestMovement.referenceId}
                              </Link>
                            ) : (
                              latestMovement.referenceNo || latestMovement.referenceId
                            )}
                          </div>

                          {movementIssue ? (
                            <div className="text-xs text-muted-foreground">
                              {movementIssue.issueType === "DIRECT_SALE"
                                ? `Direct Sale • ${movementIssue.directSaleCustomerNameSnapshot || movementIssue.issuedToNameSnapshot || "-"}`
                                : `Internal Use • ${movementIssue.issuedToNameSnapshot || "-"}`}
                            </div>
                          ) : latestMovement.referenceType === "CASTING_JOB" &&
                            castingJobMetaById.has(latestMovement.referenceId) ? (
                            <div className="text-xs text-muted-foreground">
                              Casting Job •{" "}
                              {castingJobMetaById.get(latestMovement.referenceId)?.workerNameSnapshot || "-"}{" "}
                              ({castingJobMetaById.get(latestMovement.referenceId)?.workerType || "-"})
                            </div>
                          ) : latestMovement.referenceType === "MANUAL_ADJUSTMENT" &&
                            adjustmentMetaById.has(latestMovement.referenceId) ? (
                            <div className="text-xs text-muted-foreground">
                              Manual Adjust •{" "}
                              {adjustmentMetaById.get(latestMovement.referenceId)?.reason ||
                                adjustmentMetaById.get(latestMovement.referenceId)
                                  ?.adjustedByNameSnapshot ||
                                "-"}
                            </div>
                          ) : latestMovement.referenceType === "INVOICE" &&
                            invoiceMetaById.has(latestMovement.referenceId) ? (
                            <div className="text-xs text-muted-foreground">
                              Invoice •{" "}
                              {invoiceMetaById.get(latestMovement.referenceId)
                                ?.clientNameSnapshot || "-"}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
