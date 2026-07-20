"use server";

import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { MaterialIssueType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { MaterialIssueDraftData } from "./createDraftMaterialIssueAction";

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function trimOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function finalizeMaterialIssueAction(id: string) {
  const session = await requireInventoryAccess("WRITE");

  const issue = await prisma.materialIssue.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      issueNo: true,
      issueFy: true,
      draftData: true,
    },
  });

  if (!issue) {
    return { ok: false as const, message: "Material issue not found." };
  }

  if (issue.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Only draft material issue can be finalized.",
    };
  }

  const draft = issue.draftData as MaterialIssueDraftData | null;
  if (!draft) {
    return { ok: false as const, message: "Draft data missing." };
  }

  if (!draft.items?.length) {
    return { ok: false as const, message: "Add at least one material item." };
  }

  const issueType: MaterialIssueType =
    draft.header.issueType === "DIRECT_SALE" ? "DIRECT_SALE" : "INTERNAL_USE";

  const issuedToEmployeeId = trimOrNull(draft.header.issuedToEmployeeId);
  const employee = issuedToEmployeeId
    ? await prisma.inventoryEmployee.findFirst({
        where: { id: issuedToEmployeeId, status: "ACTIVE" },
        select: { id: true, name: true, department: true },
      })
    : null;
  const internalIssuedToName = employee?.name ?? trimOrNull(draft.header.issuedToName);
  const directSaleCustomerName = trimOrNull(draft.header.directSaleCustomerName);
  const directSaleReferenceNo = trimOrNull(draft.header.directSaleReferenceNo);

  if (issueType === "INTERNAL_USE" && !employee) {
    return { ok: false as const, message: "Select an active company employee in Issued To." };
  }

  if (issueType === "DIRECT_SALE" && !directSaleCustomerName) {
    return { ok: false as const, message: "Customer name is required for direct sale." };
  }

  const issuedToNameSnapshot =
    issueType === "DIRECT_SALE"
      ? (directSaleCustomerName ?? "Unknown Customer")
      : (internalIssuedToName ?? "Unknown");

  const preparedItems = draft.items.map((item, index) => {
    const qtyIssued = Number(toNumber(item.qtyIssued, 0).toFixed(3));

    if (!item.rawMaterialId || qtyIssued <= 0) {
      throw new Error(`Invalid material item at row ${index + 1}.`);
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
      qtyIssued,
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    };
  });

  const rawMaterialIds = Array.from(
    new Set(preparedItems.map((item) => item.rawMaterialId)),
  );
  const existingRawMaterials = await prisma.rawMaterial.findMany({
    where: { id: { in: rawMaterialIds } },
    select: { id: true, companyItemName: true, inventoryActivatedAt: true },
  });
  if (existingRawMaterials.length !== rawMaterialIds.length) {
    return {
      ok: false as const,
      message: "One or more selected raw materials do not exist.",
    };
  }

  const inactiveInventoryMaterials = existingRawMaterials.filter(
    (material) => !material.inventoryActivatedAt,
  );
  if (inactiveInventoryMaterials.length > 0) {
    return {
      ok: false as const,
      message: `Complete the opening physical count before issuing: ${inactiveInventoryMaterials.map((item) => item.companyItemName).join(", ")}.`,
    };
  }

  // Hard rule: issued quantity cannot exceed current on-hand balance.
  // Enforced regardless of inventory negative-stock settings.
  const stockBalances = await prisma.stockBalance.findMany({
    where: { rawMaterialId: { in: rawMaterialIds } },
    select: { rawMaterialId: true, qtyOnHand: true },
  });

  const onHandByMaterialId = new Map<string, number>();
  for (const row of stockBalances) {
    if (!row.rawMaterialId) continue;
    onHandByMaterialId.set(row.rawMaterialId, Number(row.qtyOnHand || 0));
  }

  const requestedQtyByMaterialId = new Map<string, number>();
  const requestedItemTitlesByMaterialId = new Map<string, Set<string>>();

  for (const item of preparedItems) {
    const running = requestedQtyByMaterialId.get(item.rawMaterialId) ?? 0;
    requestedQtyByMaterialId.set(item.rawMaterialId, running + item.qtyIssued);

    const titleSet = requestedItemTitlesByMaterialId.get(item.rawMaterialId) ?? new Set<string>();
    titleSet.add(item.title || "Item");
    requestedItemTitlesByMaterialId.set(item.rawMaterialId, titleSet);
  }

  const insufficientRows: string[] = [];
  requestedQtyByMaterialId.forEach((requestedQty, materialId) => {
    const onHandQty = onHandByMaterialId.get(materialId) ?? 0;
    if (requestedQty > onHandQty) {
      const titles = Array.from(requestedItemTitlesByMaterialId.get(materialId) ?? []);
      insufficientRows.push(
        `${titles.join(", ")} (requested ${requestedQty}, available ${onHandQty})`,
      );
    }
  });

  if (insufficientRows.length > 0) {
    return {
      ok: false as const,
      message: `Issued quantity cannot be greater than balance quantity: ${insufficientRows.join("; ")}`,
    };
  }

  const issueDate = toDateOrNull(draft.header.issueDate) ?? new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.materialIssue.update({
        where: { id: issue.id },
        data: {
          status: "FINALIZED",
          issueType,
          issueDate,
          issuedToNameSnapshot,
          issuedToEmployeeId: issueType === "INTERNAL_USE" ? employee?.id ?? null : null,
          issuedByNameSnapshot: trimOrNull(draft.header.issuedByName),
          directSaleCustomerNameSnapshot:
            issueType === "DIRECT_SALE" ? directSaleCustomerName : null,
          directSaleReferenceNo:
            issueType === "DIRECT_SALE" ? directSaleReferenceNo : null,
          department:
            issueType === "INTERNAL_USE"
              ? employee?.department ?? trimOrNull(draft.header.department)
              : null,
          purpose:
            issueType === "DIRECT_SALE"
              ? "DIRECT_SALE"
              : trimOrNull(draft.header.purpose),
          workReference:
            issueType === "DIRECT_SALE"
              ? directSaleReferenceNo ?? trimOrNull(draft.header.workReference)
              : trimOrNull(draft.header.workReference),
          remarks: trimOrNull(draft.header.remarks),
          finalizedAt: new Date(),
          finalizedById: session.user.id,
          updatedById: session.user.id,
        },
      });

      await tx.materialIssueItem.deleteMany({
        where: { materialIssueId: issue.id },
      });

      for (const item of preparedItems) {
        await tx.materialIssueItem.create({
          data: {
            id: item.id,
            materialIssueId: issue.id,
            rawMaterialId: item.rawMaterialId,
            productVariantId: null,
            title: item.title,
            supplierItemName: item.supplierItemName,
            sku: item.sku,
            typeNumber: item.typeNumber,
            hsnCode: item.hsnCode,
            unit: item.unit,
            qtyIssued: item.qtyIssued,
            qtyReturned: 0,
            sortOrder: item.sortOrder,
          },
        });

        await postStockMovement(tx, {
          rawMaterialId: item.rawMaterialId,
          movementType: "OUT",
          referenceType: "MATERIAL_ISSUE",
          referenceId: issue.id,
          referenceNo: `${issue.issueFy}-${issue.issueNo}`,
          qty: item.qtyIssued,
          movementDate: issueDate,
          actorName: issuedToNameSnapshot,
          remarks:
            issueType === "DIRECT_SALE"
              ? `Direct sale issue finalized (${item.title})`
              : `Material issue finalized (${item.title})`,
          createdById: session.user.id,
        });
      }
    }, FINALIZE_TRANSACTION_OPTIONS);
  } catch (error: any) {
    return {
      ok: false as const,
      message: error?.message || "Failed to finalize material issue.",
    };
  }

  revalidatePath("/dashboard/manufacturing/material-issues");
  revalidatePath(`/dashboard/manufacturing/material-issues/${id}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");

  return { ok: true as const, message: "Material issue finalized successfully." };
}
