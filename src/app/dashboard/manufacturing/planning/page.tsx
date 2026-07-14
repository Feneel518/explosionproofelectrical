import Link from "next/link";
import { SalesOrderStatus } from "@prisma/client";

import ProductionPlanningFilters from "@/components/dashboard/manufacturing/planning/ProductionPlanningFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

type DemandRow = {
  key: string;
  variantId: string | null;
  label: string;
  sku: string | null;
  typeNumber: string | null;
  pendingQty: number;
  orderCount: number;
  clientCount: number;
};

type ComponentPlanRow = {
  key: string;
  componentType: "RAW_MATERIAL" | "CASTING";
  name: string;
  code: string | null;
  unit: string | null;
  reorderLevel: number | null;
  requiredQty: number;
  availableQty: number;
  projectedQty: number;
  shortageQty: number;
  reorderSuggestedQty: number;
  linkedVariants: number;
};

function getClientName(order: {
  customer: { companyName: string } | null;
  clientNameSnapshot: string | null;
  clientName: string | null;
}) {
  return (
    order.customer?.companyName ||
    order.clientNameSnapshot ||
    order.clientName ||
    "Unknown Client"
  );
}

function buildDemandLabel(item: {
  title: string;
  variant: {
    product: { name: string };
    variant: string;
    sku: string | null;
    typeNumber: string | null;
  } | null;
}) {
  if (!item.variant) {
    return item.title || "Unlinked Item";
  }

  const productName = item.variant.product.name || item.title || "Product";
  const variantLabel = item.variant.variant || "";
  return variantLabel ? `${productName} - ${variantLabel}` : productName;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qRaw = sp.q;
  const onlyShortageRaw = sp.onlyShortage;
  const variantIdRaw = sp.variantId;

  const qInput = (Array.isArray(qRaw) ? qRaw[0] : qRaw || "").trim();
  const q = qInput.toLowerCase();
  const onlyShortage = (Array.isArray(onlyShortageRaw)
    ? onlyShortageRaw[0]
    : onlyShortageRaw || ""
  ).toLowerCase() === "1";
  const selectedVariantId = (Array.isArray(variantIdRaw)
    ? variantIdRaw[0]
    : variantIdRaw || ""
  ).trim();

  const pendingItems = await prisma.salesOrderItem.findMany({
    where: {
      pendingQty: { gt: 0 },
      ...(selectedVariantId ? { variantId: selectedVariantId } : {}),
      salesOrder: {
        deletedAt: null,
        status: {
          notIn: [SalesOrderStatus.CANCELLED, SalesOrderStatus.COMPLETED],
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      pendingQty: true,
      variantId: true,
      salesOrder: {
        select: {
          id: true,
          orderFy: true,
          orderNo: true,
          customer: { select: { companyName: true } },
          clientNameSnapshot: true,
          clientName: true,
        },
      },
      variant: {
        select: {
          id: true,
          variant: true,
          sku: true,
          typeNumber: true,
          product: { select: { name: true } },
        },
      },
    },
    take: 5000,
  });

  const demandMap = new Map<
    string,
    DemandRow & { orderIds: Set<string>; clientNames: Set<string> }
  >();

  const orderSnapshotRows: Array<{
    orderId: string;
    orderLabel: string;
    clientName: string;
    itemLabel: string;
    pendingQty: number;
  }> = [];

  for (const item of pendingItems) {
    const label = buildDemandLabel(item);
    const searchable = [
      label,
      item.title || "",
      item.variant?.sku || "",
      item.variant?.typeNumber || "",
    ]
      .join(" ")
      .toLowerCase();

    if (q && !searchable.includes(q)) continue;

    const key = item.variantId ? `VARIANT:${item.variantId}` : `TITLE:${label}`;
    const existing = demandMap.get(key);

    if (existing) {
      existing.pendingQty += Number(item.pendingQty || 0);
      existing.orderIds.add(item.salesOrder.id);
      existing.clientNames.add(getClientName(item.salesOrder));
    } else {
      demandMap.set(key, {
        key,
        variantId: item.variantId ?? null,
        label,
        sku: item.variant?.sku ?? null,
        typeNumber: item.variant?.typeNumber ?? null,
        pendingQty: Number(item.pendingQty || 0),
        orderCount: 0,
        clientCount: 0,
        orderIds: new Set([item.salesOrder.id]),
        clientNames: new Set([getClientName(item.salesOrder)]),
      });
    }

    orderSnapshotRows.push({
      orderId: item.salesOrder.id,
      orderLabel: formatFinancialDocumentNumber(
        item.salesOrder.orderFy,
        item.salesOrder.orderNo,
      ),
      clientName: getClientName(item.salesOrder),
      itemLabel: label,
      pendingQty: Number(item.pendingQty || 0),
    });
  }

  const demandRows = Array.from(demandMap.values())
    .map((row) => ({
      key: row.key,
      variantId: row.variantId,
      label: row.label,
      sku: row.sku,
      typeNumber: row.typeNumber,
      pendingQty: row.pendingQty,
      orderCount: row.orderIds.size,
      clientCount: row.clientNames.size,
    }))
    .sort((a, b) => b.pendingQty - a.pendingQty);

  const variantDemandRows = demandRows.filter(
    (row): row is DemandRow & { variantId: string } => Boolean(row.variantId),
  );
  const variantIds = variantDemandRows.map((row) => row.variantId);

  const boms =
    variantIds.length > 0
      ? await prisma.variantBom.findMany({
          where: {
            variantId: { in: variantIds },
            isActive: true,
          },
          select: {
            id: true,
            variantId: true,
            items: {
              select: {
                componentType: true,
                qtyPerUnit: true,
                rawMaterialId: true,
                rawMaterial: {
                  select: {
                    companyItemName: true,
                    itemCode: true,
                    unit: true,
                    reorderLevel: true,
                    stockBalance: { select: { qtyAvailable: true } },
                  },
                },
                castingMasterId: true,
                castingMaster: {
                  select: {
                    castingItemName: true,
                    castingCode: true,
                    unit: true,
                    reorderLevel: true,
                    stockBalance: { select: { qtyAvailable: true } },
                  },
                },
              },
            },
          },
        })
      : [];

  const bomByVariantId = new Map(boms.map((bom) => [bom.variantId, bom]));

  const componentPlanMap = new Map<
    string,
    ComponentPlanRow & { variantSet: Set<string> }
  >();

  for (const row of variantDemandRows) {
    const bom = bomByVariantId.get(row.variantId);
    if (!bom) continue;

    for (const item of bom.items) {
      const qtyPerUnit = Math.max(0, Math.trunc(Number(item.qtyPerUnit || 0)));
      if (qtyPerUnit <= 0) continue;

      const requiredQty = row.pendingQty * qtyPerUnit;
      if (requiredQty <= 0) continue;

      if (item.componentType === "RAW_MATERIAL" && item.rawMaterialId) {
        const key = `RM:${item.rawMaterialId}`;
        const existing = componentPlanMap.get(key);
        const available = Number(item.rawMaterial?.stockBalance?.qtyAvailable ?? 0);
        const reorderLevel = item.rawMaterial?.reorderLevel ?? null;

        if (existing) {
          existing.requiredQty += requiredQty;
          existing.variantSet.add(row.variantId);
        } else {
          componentPlanMap.set(key, {
            key,
            componentType: "RAW_MATERIAL",
            name: item.rawMaterial?.companyItemName || "Raw Material",
            code: item.rawMaterial?.itemCode || null,
            unit: item.rawMaterial?.unit || null,
            reorderLevel,
            requiredQty,
            availableQty: available,
            projectedQty: 0,
            shortageQty: 0,
            reorderSuggestedQty: 0,
            linkedVariants: 0,
            variantSet: new Set([row.variantId]),
          });
        }
      }

      if (item.componentType === "CASTING" && item.castingMasterId) {
        const key = `CM:${item.castingMasterId}`;
        const existing = componentPlanMap.get(key);
        const available = Number(item.castingMaster?.stockBalance?.qtyAvailable ?? 0);
        const reorderLevel = item.castingMaster?.reorderLevel ?? null;

        if (existing) {
          existing.requiredQty += requiredQty;
          existing.variantSet.add(row.variantId);
        } else {
          componentPlanMap.set(key, {
            key,
            componentType: "CASTING",
            name: item.castingMaster?.castingItemName || "Casting",
            code: item.castingMaster?.castingCode || null,
            unit: item.castingMaster?.unit || null,
            reorderLevel,
            requiredQty,
            availableQty: available,
            projectedQty: 0,
            shortageQty: 0,
            reorderSuggestedQty: 0,
            linkedVariants: 0,
            variantSet: new Set([row.variantId]),
          });
        }
      }
    }
  }

  const componentPlanRows = Array.from(componentPlanMap.values())
    .map((row) => {
      const projectedQty = row.availableQty - row.requiredQty;
      const shortageQty = Math.max(row.requiredQty - row.availableQty, 0);
      const safety = Math.max(Number(row.reorderLevel ?? 0), 0);
      const reorderSuggestedQty = Math.max(row.requiredQty + safety - row.availableQty, 0);

      return {
        key: row.key,
        componentType: row.componentType,
        name: row.name,
        code: row.code,
        unit: row.unit,
        reorderLevel: row.reorderLevel,
        requiredQty: row.requiredQty,
        availableQty: row.availableQty,
        projectedQty,
        shortageQty,
        reorderSuggestedQty,
        linkedVariants: row.variantSet.size,
      };
    })
    .filter((row) => (onlyShortage ? row.shortageQty > 0 : true))
    .sort((a, b) => {
      if (b.shortageQty !== a.shortageQty) return b.shortageQty - a.shortageQty;
      return b.requiredQty - a.requiredQty;
    });

  const missingBomRows = variantDemandRows.filter(
    (row) => !bomByVariantId.has(row.variantId),
  );

  const totalPendingQty = demandRows.reduce((sum, row) => sum + row.pendingQty, 0);
  const totalRequiredQty = componentPlanRows.reduce(
    (sum, row) => sum + row.requiredQty,
    0,
  );
  const totalShortageQty = componentPlanRows.reduce(
    (sum, row) => sum + row.shortageQty,
    0,
  );
  const totalReorderQty = componentPlanRows.reduce(
    (sum, row) => sum + row.reorderSuggestedQty,
    0,
  );

  const uniqueOrderCount = new Set(orderSnapshotRows.map((row) => row.orderId)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production Planning</h1>
          <p className="text-sm text-muted-foreground">
            Pending orders to BOM demand plan with stock availability and reorder gap.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/manufacturing/bom">Manage BOM</Link>
          </Button>
        </div>
      </div>

      <ProductionPlanningFilters
        initialQ={qInput}
        initialOnlyShortage={onlyShortage}
        initialVariantId={selectedVariantId || null}
      />

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Pending Orders</div>
          <div className="text-2xl font-semibold">{uniqueOrderCount}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Pending Variants</div>
          <div className="text-2xl font-semibold">{variantDemandRows.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Total Pending Qty</div>
          <div className="text-2xl font-semibold">{totalPendingQty}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Total BOM Required</div>
          <div className="text-2xl font-semibold">{totalRequiredQty}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Immediate Shortage</div>
          <div className="text-2xl font-semibold">{totalShortageQty}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Suggested Reorder</div>
          <div className="text-2xl font-semibold">{totalReorderQty}</div>
        </div>
      </div>

      <div className="rounded-xl border p-2">
        <div className="px-2 py-1 text-sm font-medium">Pending Finished Goods Demand</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Product / Variant</TableHead>
              <TableHead className="text-white">SKU / Type</TableHead>
              <TableHead className="text-right text-white">Pending Qty</TableHead>
              <TableHead className="text-right text-white">Orders</TableHead>
              <TableHead className="text-right text-white">Clients</TableHead>
              <TableHead className="text-white">BOM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No pending demand found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              demandRows.map((row) => {
                const hasBom =
                  row.variantId != null ? bomByVariantId.has(row.variantId) : false;
                return (
                  <TableRow key={row.key}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>
                      {[row.sku, row.typeNumber].filter(Boolean).join(" | ") || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{row.pendingQty}</TableCell>
                    <TableCell className="text-right">{row.orderCount}</TableCell>
                    <TableCell className="text-right">{row.clientCount}</TableCell>
                    <TableCell>
                      {row.variantId == null ? (
                        <Badge variant="secondary">No Variant</Badge>
                      ) : hasBom ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border p-2">
        <div className="px-2 py-1 text-sm font-medium">Component Requirement vs Stock</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Component</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-right text-white">Required</TableHead>
              <TableHead className="text-right text-white">Available</TableHead>
              <TableHead className="text-right text-white">Projected</TableHead>
              <TableHead className="text-right text-white">Shortage</TableHead>
              <TableHead className="text-right text-white">Reorder</TableHead>
              <TableHead className="text-right text-white">Linked FG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {componentPlanRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No component requirement generated yet.
                </TableCell>
              </TableRow>
            ) : (
              componentPlanRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <div>{row.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[row.code, row.unit].filter(Boolean).join(" | ") || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {row.componentType === "RAW_MATERIAL" ? "Raw Material" : "Casting"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.requiredQty}</TableCell>
                  <TableCell className="text-right">{row.availableQty}</TableCell>
                  <TableCell className="text-right">
                    <span className={row.projectedQty < 0 ? "text-destructive font-medium" : ""}>
                      {row.projectedQty}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={row.shortageQty > 0 ? "text-destructive font-medium" : ""}>
                      {row.shortageQty}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>{row.reorderSuggestedQty}</div>
                    <div className="text-xs text-muted-foreground">
                      Min: {row.reorderLevel ?? 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{row.linkedVariants}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {missingBomRows.length > 0 ? (
        <div className="rounded-xl border border-destructive/40 p-2">
          <div className="px-2 py-1 text-sm font-medium text-destructive">
            Pending Variants Without Active BOM
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Product / Variant</TableHead>
                <TableHead className="text-right text-white">Pending Qty</TableHead>
                <TableHead className="text-right text-white">Orders</TableHead>
                <TableHead className="text-right text-white">Clients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missingBomRows.map((row) => (
                <TableRow key={`missing-${row.key}`}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right font-semibold">{row.pendingQty}</TableCell>
                  <TableCell className="text-right">{row.orderCount}</TableCell>
                  <TableCell className="text-right">{row.clientCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
