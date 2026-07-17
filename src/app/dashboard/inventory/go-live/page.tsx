import InventoryGoLiveManager from "@/components/dashboard/inventory/go-live/InventoryGoLiveManager";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

function dateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function Page() {
  await requireAuth();
  const [settings, rows] = await Promise.all([
    prisma.inventorySetting.findUnique({ where: { id: "default" } }),
    prisma.rawMaterial.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: [{ inventoryActivatedAt: "asc" }, { companyItemName: "asc" }],
      select: { id: true, itemCode: true, companyItemName: true, unit: true, openingStockQty: true, openingStockAt: true, inventoryActivatedAt: true, inventoryActivationSource: true, stockBalance: { select: { qtyOnHand: true } } },
    }),
  ]);
  const materials = rows.map((row) => ({ ...row, openingStockQty: Number(row.openingStockQty), openingStockAt: row.openingStockAt?.toISOString() ?? null, inventoryActivatedAt: row.inventoryActivatedAt?.toISOString() ?? null, qtyOnHand: Number(row.stockBalance?.qtyOnHand ?? 0), stockBalance: undefined }));

  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Inventory Go-Live</h1><p className="text-sm text-muted-foreground">Set the cut-off and complete each raw material’s physical opening count. Only inventory-active materials can be issued.</p></div><InventoryGoLiveManager goLiveDate={dateInput(settings?.inventoryGoLiveDate)} physicalCountDate={dateInput(settings?.physicalStockCountAt)} materials={materials} /></div>;
}
