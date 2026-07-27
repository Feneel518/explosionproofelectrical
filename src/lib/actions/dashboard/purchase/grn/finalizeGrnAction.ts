"use server";

import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { GrnDraftData } from "./createDraftGrnAction";

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampPercent(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return round2(n);
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeInvoiceFiles(
  files: GrnDraftData["header"]["supplierInvoiceFiles"],
) {
  return (files ?? [])
    .map((file) => ({
      kind: typeof file?.kind === "string" ? file.kind : "DRAWING",
      url: (file?.url ?? "").trim(),
      title: typeof file?.title === "string" ? file.title.trim() : null,
    }))
    .filter((file) => file.url.length > 0);
}

async function recomputeRawMaterialBalance(
  tx: Prisma.TransactionClient,
  rawMaterialId: string,
) {
  const [rawMaterial, ledgerAgg, latestLedger, existingBalance, openingMovement] =
    await Promise.all([
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
      tx.stockLedger.findFirst({
        where: {
          rawMaterialId,
          referenceType: "MANUAL_ADJUSTMENT",
          referenceNo: "OPENING-STOCK",
        },
        select: { id: true },
      }),
    ]);

  const openingQty = Number(rawMaterial?.openingStockQty || 0);
  const qtyIn = Number(ledgerAgg._sum.qtyIn || 0);
  const qtyOut = Number(ledgerAgg._sum.qtyOut || 0);
  const qtyFromLedger = qtyIn - qtyOut;
  const qtyOnHand = openingMovement ? qtyFromLedger : openingQty + qtyFromLedger;
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
    return;
  }

  if (qtyOnHand !== 0 || qtyReserved !== 0 || lastMovementAt) {
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

export async function finalizeGrnAction(id: string) {
  const session = await requireInventoryAccess("WRITE");

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      grnNo: true,
      grnFy: true,
      draftData: true,
    },
  });

  if (!grn) {
    return { ok: false as const, message: "GRN not found." };
  }

  if (grn.status === "CANCELLED") {
    return { ok: false as const, message: "Cancelled GRN cannot be finalized." };
  }

  const isUpdatingFinalizedGrn = grn.status === "FINALIZED";

  const draft = grn.draftData as GrnDraftData | null;
  if (!draft) {
    return { ok: false as const, message: "GRN draft data missing." };
  }

  if (!draft.items?.length) {
    return { ok: false as const, message: "Add at least one item in GRN." };
  }

  const preparedItems = draft.items.map((item, index) => {
    const qty = Math.max(0, Number(toNumber(item.qty, 0).toFixed(3)));
    const unitCost = Math.max(0, toNumber(item.unitCost, 0));
    const discountPercent = clampPercent(item.discountPercent);
    const grossAmount = round2(qty * unitCost);
    const discountAmount = round2((grossAmount * discountPercent) / 100);
    const lineTotal = round2(Math.max(0, grossAmount - discountAmount));
    const effectiveUnitCost = qty > 0 ? round2(lineTotal / qty) : 0;

    if (!item.rawMaterialId || qty <= 0) {
      throw new Error(`Invalid GRN item at row ${index + 1}.`);
    }

    return {
      id: item.id || crypto.randomUUID(),
      rawMaterialId: item.rawMaterialId,
      title: item.title?.trim() || "Item",
      supplierItemName: item.supplierItemName?.trim() || null,
      sku: item.sku ?? null,
      typeNumber: item.typeNumber ?? null,
      hsnCode: item.hsnCode ?? null,
      unit: item.unit ?? "Nos",
      qty,
      unitCost,
      discountPercent,
      grossAmount,
      discountAmount,
      effectiveUnitCost,
      lineTotal,
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    };
  });

  const rawMaterialIds = Array.from(
    new Set(preparedItems.map((item) => item.rawMaterialId)),
  );
  const existingRawMaterials = await prisma.rawMaterial.findMany({
    where: { id: { in: rawMaterialIds } },
    select: { id: true },
  });
  if (existingRawMaterials.length !== rawMaterialIds.length) {
    return {
      ok: false as const,
      message: "One or more selected raw materials do not exist.",
    };
  }

  const receivedAt = toDateOrNull(draft.header.receivedAt) ?? new Date();
  const supplierInvoiceDate = toDateOrNull(draft.header.supplierInvoiceDate);
  const supplierId = draft.header.supplierId?.trim() || null;

  const inventorySettings = await prisma.inventorySetting.findUnique({
    where: { id: "default" },
    select: { inventoryGoLiveDate: true },
  });
  if (
    inventorySettings?.inventoryGoLiveDate &&
    receivedAt < inventorySettings.inventoryGoLiveDate
  ) {
    return {
      ok: false as const,
      message: `This GRN predates inventory go-live (${inventorySettings.inventoryGoLiveDate.toLocaleDateString("en-IN")}) and cannot post stock. Keep it as a historical record only.`,
    };
  }

  const supplier = supplierId
    ? await prisma.supplier.findFirst({
        where: { id: supplierId, deletedAt: null },
        select: { id: true, companyName: true },
      })
    : null;

  if (supplierId && !supplier) {
    return { ok: false as const, message: "Selected supplier no longer exists." };
  }

  const supplierInvoiceNo = draft.header.supplierInvoiceNo?.trim() || null;
  if (supplierInvoiceNo) {
    const duplicateInvoice = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: { not: grn.id },
        status: { not: "CANCELLED" },
        supplierInvoiceNo: { equals: supplierInvoiceNo, mode: "insensitive" },
        ...(supplierId ? { supplierId } : { supplierNameSnapshot: supplier?.companyName ?? draft.header.supplierName?.trim() }),
      },
      select: { grnNo: true, grnFy: true },
    });
    if (duplicateInvoice) {
      return {
        ok: false as const,
        message: `Supplier invoice ${supplierInvoiceNo} is already used in ${duplicateInvoice.grnFy}-${duplicateInvoice.grnNo}.`,
      };
    }
  }

  const supplierNameSnapshot =
    supplier?.companyName?.trim() || draft.header.supplierName?.trim() || null;

  const supplierInvoiceFiles = normalizeInvoiceFiles(
    draft.header.supplierInvoiceFiles,
  );

  const transportationPaid = Boolean(draft.header.transportationPaid);
  const transportationPaidAmount = transportationPaid
    ? Number(toNumber(draft.header.transportationPaidAmount, 0).toFixed(2))
    : null;
  const transportationPaidAmountValue = transportationPaidAmount ?? 0;

  if (transportationPaid && transportationPaidAmountValue <= 0) {
    return {
      ok: false as const,
      message: "Enter transportation paid amount when transportation is marked paid.",
    };
  }

  await prisma.$transaction(async (tx) => {
    const previousLedgerRows = await tx.stockLedger.findMany({
      where: {
        referenceType: "GRN",
        referenceId: grn.id,
      },
      select: {
        rawMaterialId: true,
      },
    });

    if (previousLedgerRows.length > 0) {
      const touchedRawMaterialIds = Array.from(
        new Set(
          previousLedgerRows
            .map((row) => row.rawMaterialId)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      await tx.stockLedger.deleteMany({
        where: {
          referenceType: "GRN",
          referenceId: grn.id,
        },
      });

      for (const rawMaterialId of touchedRawMaterialIds) {
        await recomputeRawMaterialBalance(tx, rawMaterialId);
      }
    }

    await tx.goodsReceiptNote.update({
      where: { id: grn.id },
      data: {
        status: "FINALIZED",
        receivedAt,
        supplierId,
        supplierNameSnapshot,
        supplierInvoiceNo,
        supplierInvoiceDate,
        supplierInvoiceFiles:
          supplierInvoiceFiles.length > 0
            ? (supplierInvoiceFiles as Prisma.InputJsonValue)
            : Prisma.DbNull,
        transporterName: draft.header.transporterName?.trim() || null,
        lrNumber: draft.header.lrNumber?.trim() || null,
        transportationPaid,
        transportationPaidAmount,
        remarks: draft.header.remarks?.trim() || null,
        finalizedAt: new Date(),
        finalizedById: session.user.id,
        updatedById: session.user.id,
      },
    });

    await tx.goodsReceiptNoteItem.deleteMany({
      where: { grnId: grn.id },
    });

    for (const item of preparedItems) {
      await tx.goodsReceiptNoteItem.create({
        data: {
          id: item.id,
          grnId: grn.id,
          rawMaterialId: item.rawMaterialId,
          productVariantId: null,
          title: item.title,
          supplierItemName: item.supplierItemName,
          sku: item.sku,
          typeNumber: item.typeNumber,
          hsnCode: item.hsnCode,
          unit: item.unit,
          qty: item.qty,
          unitCost: item.unitCost,
          discountPercent: item.discountPercent,
          grossAmount: item.grossAmount,
          discountAmount: item.discountAmount,
          effectiveUnitCost: item.effectiveUnitCost,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
        },
      });

      await postStockMovement(tx, {
        rawMaterialId: item.rawMaterialId,
        movementType: "IN",
        referenceType: "GRN",
        referenceId: grn.id,
        referenceNo: `${grn.grnFy}-${grn.grnNo}`,
        qty: item.qty,
        unitCost: item.effectiveUnitCost,
        movementDate: receivedAt,
        actorName: supplierNameSnapshot,
        remarks: `GRN finalized (${item.title})`,
        createdById: session.user.id,
      });

      await tx.rawMaterial.updateMany({
        where: { id: item.rawMaterialId, inventoryActivatedAt: null },
        data: {
          inventoryActivatedAt: receivedAt,
          inventoryActivationSource: "POST_GO_LIVE_GRN",
        },
      });
    }
  }, FINALIZE_TRANSACTION_OPTIONS);

  revalidatePath("/dashboard/purchase/grn");
  revalidatePath(`/dashboard/purchase/grn/${id}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");
  revalidatePath("/dashboard/inventory/go-live");

  return {
    ok: true as const,
    message: isUpdatingFinalizedGrn
      ? "GRN changes saved and inventory updated successfully."
      : "GRN finalized successfully.",
  };
}
