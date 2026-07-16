import StockSummaryInfiniteTable from "@/components/dashboard/inventory/stock/StockSummaryInfiniteTable";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function Page() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const monthLabel = formatMonthLabel(monthStart);

  const settings = await prisma.inventorySetting.findUnique({
    where: { id: "default" },
    select: { lowStockThreshold: true },
  });
  const threshold = settings?.lowStockThreshold ?? 0;

  const [stockAgg, trackedItemsCount, rawMaterialCount, finishedGoodCount, castingCount, lowStockCount, mtdAgg] =
    await Promise.all([
      prisma.stockBalance.aggregate({
        _sum: {
          qtyOnHand: true,
        },
      }),
      prisma.stockBalance.count(),
      prisma.stockBalance.count({ where: { rawMaterialId: { not: null } } }),
      prisma.stockBalance.count({ where: { productVariantId: { not: null } } }),
      prisma.stockBalance.count({ where: { castingMasterId: { not: null } } }),
      prisma.stockBalance.count({
        where: {
          qtyAvailable: { lte: threshold },
        },
      }),
      prisma.stockLedger.aggregate({
        where: {
          movementDate: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: {
          qtyIn: true,
          qtyOut: true,
        },
      }),
    ]);

  const totalOnHand = Number(stockAgg._sum.qtyOnHand ?? 0);
  const totalsMtd = {
    inward: Number(mtdAgg._sum.qtyIn ?? 0),
    consumed: Number(mtdAgg._sum.qtyOut ?? 0),
  };
  const openingQty = totalOnHand - totalsMtd.inward + totalsMtd.consumed;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock Summary</h1>
        <p className="text-sm text-muted-foreground">
          Live stock from ledger postings across GRN, dispatch, return, issue, and adjustment documents.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5 xl:grid-cols-9">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Tracked Items</div>
          <div className="text-2xl font-semibold">{trackedItemsCount}</div>
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
          <div className="text-xs text-muted-foreground">Opening ({monthLabel})</div>
          <div className="text-2xl font-semibold">{formatNumber(openingQty)}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Inward MTD ({monthLabel})</div>
          <div className="text-2xl font-semibold">{formatNumber(totalsMtd.inward)}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Consumed MTD ({monthLabel})</div>
          <div className="text-2xl font-semibold">{formatNumber(totalsMtd.consumed)}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">
            Low Stock ({"<="} {Number(threshold)})
          </div>
          <div className="text-2xl font-semibold">{lowStockCount}</div>
        </div>
      </div>

      <StockSummaryInfiniteTable monthLabel={monthLabel} threshold={Number(threshold)} />
    </div>
  );
}
