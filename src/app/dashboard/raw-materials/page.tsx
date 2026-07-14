import { FC } from "react";

import RawMaterialsTable from "@/components/dashboard/raw-material/RawMaterialsTable";
import {
  buildRawMaterialWhere,
  buildRawMaterialsOrderBy,
} from "@/lib/helpers/RepoHelpers/RawMaterialRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";
import { rawMaterialsSearchParamsCache } from "@/lib/searchParams/dashboard/raw-materials/rawMaterialsSearchParams";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

const Page: FC<PageProps> = async ({ searchParams }) => {
  const sp = rawMaterialsSearchParamsCache.parse(await searchParams);

  const page = Math.max(1, sp.page);
  const pageSize = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildRawMaterialWhere(sp);
  const orderBy = buildRawMaterialsOrderBy(sp);

  const [items, total, metricRows] = await Promise.all([
    prisma.rawMaterial.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        companyItemName: true,
        supplierItemName: true,
        itemCode: true,
        hsnCode: true,
        unit: true,
        reorderLevel: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        preferredSupplier: {
          select: {
            companyName: true,
          },
        },
        stockBalance: {
          select: {
            qtyOnHand: true,
          },
        },
      },
    }),
    prisma.rawMaterial.count({ where }),
    prisma.rawMaterial.findMany({
      where,
      select: {
        status: true,
        reorderLevel: true,
        stockBalance: {
          select: {
            qtyOnHand: true,
          },
        },
      },
    }),
  ]);

  const rawMaterialIds = items.map((item) => item.id);

  const latestPriceRows =
    rawMaterialIds.length === 0
      ? []
      : await prisma.goodsReceiptNoteItem.findMany({
          where: {
            rawMaterialId: { in: rawMaterialIds },
            grn: { status: "FINALIZED" },
          },
          orderBy: [{ grn: { receivedAt: "desc" } }, { createdAt: "desc" }],
          select: {
            rawMaterialId: true,
            effectiveUnitCost: true,
            unitCost: true,
            grn: {
              select: {
                receivedAt: true,
                supplierNameSnapshot: true,
              },
            },
          },
        });

  const latestPriceByMaterialId = new Map<
    string,
    {
      lastPurchasePrice: number | null;
      lastPurchaseAt: Date | null;
      lastPurchaseSupplier: string | null;
    }
  >();

  for (const row of latestPriceRows) {
    const materialId = row.rawMaterialId;
    if (!materialId || latestPriceByMaterialId.has(materialId)) continue;

    latestPriceByMaterialId.set(materialId, {
      lastPurchasePrice: Number(row.effectiveUnitCost ?? row.unitCost ?? 0),
      lastPurchaseAt: row.grn.receivedAt ?? null,
      lastPurchaseSupplier: row.grn.supplierNameSnapshot ?? null,
    });
  }

  const enrichedItems = items.map((item) => {
    const latest = latestPriceByMaterialId.get(item.id);
    return {
      ...item,
      stockOnHand: Number(item.stockBalance?.qtyOnHand ?? 0),
      lastPurchasePrice: latest?.lastPurchasePrice ?? null,
      lastPurchaseAt: latest?.lastPurchaseAt ?? null,
      lastPurchaseSupplier: latest?.lastPurchaseSupplier ?? null,
    };
  });

  const totalOnHand = metricRows.reduce(
    (sum, row) => sum + Number(row.stockBalance?.qtyOnHand ?? 0),
    0,
  );
  const activeCount = metricRows.filter((row) => row.status === "ACTIVE").length;
  const lowStockCount = metricRows.filter((row) => {
    if (row.reorderLevel == null) return false;
    return Number(row.stockBalance?.qtyOnHand ?? 0) <= row.reorderLevel;
  }).length;

  const safeItems = serializeForClient(enrichedItems);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raw Materials</h1>
          <p className="text-sm text-muted-foreground">
            Maintain purchase and stock item names for supplier and company mapping.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Total Materials</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Active</div>
          <div className="text-2xl font-semibold">{activeCount}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Total On Hand</div>
          <div className="text-2xl font-semibold">{formatNumber(totalOnHand)}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Low Stock</div>
          <div className="text-2xl font-semibold">{lowStockCount}</div>
        </div>
      </div>

      <RawMaterialsTable
        items={safeItems as any}
        total={total}
        page={page}
        pageSize={pageSize}
        qp={sp}
      />
    </div>
  );
};

export default Page;
