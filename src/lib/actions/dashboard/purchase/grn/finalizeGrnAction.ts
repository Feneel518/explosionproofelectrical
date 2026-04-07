"use server";

import { requireAuth } from "@/lib/check/requireAuth";
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

export async function finalizeGrnAction(id: string) {
  const session = await requireAuth();

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

  if (grn.status !== "DRAFT") {
    return { ok: false as const, message: "Only draft GRN can be finalized." };
  }

  const draft = grn.draftData as GrnDraftData | null;
  if (!draft) {
    return { ok: false as const, message: "GRN draft data missing." };
  }

  if (!draft.items?.length) {
    return { ok: false as const, message: "Add at least one item in GRN." };
  }

  const preparedItems = draft.items.map((item, index) => {
    const qty = Math.max(0, Math.trunc(toNumber(item.qty, 0)));
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

  const supplier = supplierId
    ? await prisma.supplier.findFirst({
        where: { id: supplierId, deletedAt: null },
        select: { id: true, companyName: true },
      })
    : null;

  if (supplierId && !supplier) {
    return { ok: false as const, message: "Selected supplier no longer exists." };
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
    await tx.goodsReceiptNote.update({
      where: { id: grn.id },
      data: {
        status: "FINALIZED",
        receivedAt,
        supplierId,
        supplierNameSnapshot,
        supplierInvoiceNo: draft.header.supplierInvoiceNo?.trim() || null,
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
    }
  }, FINALIZE_TRANSACTION_OPTIONS);

  revalidatePath("/dashboard/purchase/grn");
  revalidatePath(`/dashboard/purchase/grn/${id}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");

  return { ok: true as const, message: "GRN finalized successfully." };
}
