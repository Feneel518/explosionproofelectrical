import { Prisma, StockMovementType, StockReferenceType } from "@prisma/client";

type PostStockMovementInput = {
  productVariantId?: string | null;
  rawMaterialId?: string | null;
  castingMasterId?: string | null;
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
  if (input.referenceType === "CASTING_JOB") {
    const castHasRawMaterial = Boolean(input.rawMaterialId);
    const castHasCastingMaster = Boolean(input.castingMasterId);
    const castHasVariant = Boolean(input.productVariantId);

    if (castHasVariant) {
      throw new Error(
        "Casting job stock movement cannot target finished product variants.",
      );
    }

    if (castHasRawMaterial) {
      if (input.movementType !== "OUT") {
        throw new Error(
          "Casting job raw material movement can only be OUT. Aluminum return is not auto-restocked.",
        );
      }
    } else if (castHasCastingMaster) {
      if (input.movementType !== "IN") {
        throw new Error(
          "Casting job casting movement can only be IN on receipt.",
        );
      }
    } else {
      throw new Error(
        "Casting job stock movement must target either raw material or casting.",
      );
    }
  }

  const qty = Math.trunc(Number(input.qty || 0));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Stock movement quantity must be greater than 0.");
  }

  const hasRawMaterial = Boolean(input.rawMaterialId);
  const hasVariant = Boolean(input.productVariantId);
  const hasCastingMaster = Boolean(input.castingMasterId);

  const linkedCount = [hasRawMaterial, hasVariant, hasCastingMaster].filter(Boolean)
    .length;

  if (linkedCount === 0) {
    throw new Error(
      "Stock movement must include raw material, casting master, or product variant.",
    );
  }
  if (linkedCount > 1) {
    throw new Error(
      "Stock movement cannot include more than one stock entity at a time.",
    );
  }

  const settings = await tx.inventorySetting.findUnique({
    where: { id: "default" },
    select: { allowNegativeStock: true },
  });

  const allowNegativeStock = settings?.allowNegativeStock ?? false;

  const existingBalance = await tx.stockBalance.findFirst({
    where: hasRawMaterial
      ? { rawMaterialId: input.rawMaterialId! }
      : hasCastingMaster
        ? { castingMasterId: input.castingMasterId! }
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
        castingMasterId: input.castingMasterId ?? null,
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
      castingMasterId: input.castingMasterId ?? null,
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
