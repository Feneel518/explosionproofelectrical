import { Prisma, StockMovementType, StockReferenceType } from "@prisma/client";

type PostStockMovementInput = {
  productVariantId?: string | null;
  rawMaterialId?: string | null;
  movementType: StockMovementType;
  referenceType: StockReferenceType;
  referenceId: string;
  referenceNo?: string | null;
  qty: number;
  unitCost?: number | null;
  movementDate?: Date;
  actorName?: string | null;
  remarks?: string | null;
  createdById?: string | null;
};

function getDelta(movementType: StockMovementType, qty: number): number {
  switch (movementType) {
    case "IN":
    case "RETURN_IN":
    case "ADJUST_IN":
      return qty;
    case "OUT":
    case "RETURN_OUT":
    case "ADJUST_OUT":
    case "SCRAP_OUT":
      return -qty;
    default:
      return 0;
  }
}

export async function postStockMovement(
  tx: Prisma.TransactionClient,
  input: PostStockMovementInput,
) {
  const qty = Math.trunc(Number(input.qty || 0));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Stock movement quantity must be greater than 0.");
  }

  const hasRawMaterial = Boolean(input.rawMaterialId);
  const hasVariant = Boolean(input.productVariantId);

  if (!hasRawMaterial && !hasVariant) {
    throw new Error("Stock movement must include raw material or product variant.");
  }
  if (hasRawMaterial && hasVariant) {
    throw new Error("Stock movement cannot include both raw material and product variant.");
  }

  const settings = await tx.inventorySetting.findUnique({
    where: { id: "default" },
    select: { allowNegativeStock: true },
  });

  const allowNegativeStock = settings?.allowNegativeStock ?? false;

  const existingBalance = await tx.stockBalance.findFirst({
    where: hasRawMaterial
      ? { rawMaterialId: input.rawMaterialId! }
      : { productVariantId: input.productVariantId! },
    select: {
      id: true,
      qtyOnHand: true,
      qtyReserved: true,
    },
  });

  const currentOnHand = existingBalance?.qtyOnHand ?? 0;
  const currentReserved = existingBalance?.qtyReserved ?? 0;

  const delta = getDelta(input.movementType, qty);
  const nextOnHand = currentOnHand + delta;
  const nextAvailable = nextOnHand - currentReserved;

  if (!allowNegativeStock && nextOnHand < 0) {
    throw new Error("Insufficient stock for this movement.");
  }

  if (existingBalance) {
    await tx.stockBalance.update({
      where: { id: existingBalance.id },
      data: {
        qtyOnHand: nextOnHand,
        qtyAvailable: nextAvailable,
        lastMovementAt: input.movementDate ?? new Date(),
      },
    });
  } else {
    await tx.stockBalance.create({
      data: {
        productVariantId: input.productVariantId ?? null,
        rawMaterialId: input.rawMaterialId ?? null,
        qtyOnHand: nextOnHand,
        qtyReserved: 0,
        qtyAvailable: nextOnHand,
        lastMovementAt: input.movementDate ?? new Date(),
      },
    });
  }

  const qtyIn = delta > 0 ? qty : 0;
  const qtyOut = delta < 0 ? Math.abs(delta) : 0;
  const unitCost =
    input.unitCost == null ? null : Number(input.unitCost.toFixed(2));
  const totalCost =
    unitCost == null ? null : Number((unitCost * qty).toFixed(2));

  await tx.stockLedger.create({
    data: {
      movementDate: input.movementDate ?? new Date(),
      movementType: input.movementType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNo: input.referenceNo ?? null,
      productVariantId: input.productVariantId ?? null,
      rawMaterialId: input.rawMaterialId ?? null,
      qtyIn,
      qtyOut,
      balanceAfter: nextOnHand,
      unitCost,
      totalCost,
      actorName: input.actorName ?? null,
      remarks: input.remarks ?? null,
      createdById: input.createdById ?? null,
    },
  });

  return {
    qtyIn,
    qtyOut,
    balanceAfter: nextOnHand,
  };
}
