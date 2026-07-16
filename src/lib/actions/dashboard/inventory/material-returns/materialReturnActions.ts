"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { revalidatePath } from "next/cache";

export type MaterialReturnInput = {
  materialIssueId: string;
  returnDate?: string | null;
  receivedByName?: string | null;
  remarks?: string | null;
  items: Array<{
    materialIssueItemId: string;
    qty: number;
    condition: "REUSABLE" | "DAMAGED" | "SCRAP";
    remarks?: string | null;
  }>;
};

export async function getReturnableMaterialIssueAction(materialIssueId: string) {
  await requireAuth();
  const issue = await prisma.materialIssue.findFirst({
    where: { id: materialIssueId, status: "FINALIZED" },
    select: {
      id: true,
      issueNo: true,
      issueFy: true,
      issueDate: true,
      issuedToNameSnapshot: true,
      issuedToEmployeeId: true,
      department: true,
      purpose: true,
      items: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, rawMaterialId: true, title: true, unit: true, qtyIssued: true, qtyReturned: true },
      },
    },
  });
  if (!issue) return { ok: false as const, message: "Finalized material issue not found." };
  return {
    ok: true as const,
    issue: {
      ...issue,
      items: issue.items.map((item) => ({
        ...item,
        qtyIssued: Number(item.qtyIssued),
        qtyReturned: Number(item.qtyReturned),
        qtyPending: Number(item.qtyIssued) - Number(item.qtyReturned),
      })),
    },
  };
}

export async function createAndFinalizeMaterialReturnAction(input: MaterialReturnInput) {
  const session = await requireInventoryAccess("WRITE");
  const returnDate = input.returnDate ? new Date(input.returnDate) : new Date();
  if (Number.isNaN(returnDate.getTime())) return { ok: false as const, message: "Invalid return date." };

  const requested = input.items
    .map((item) => ({ ...item, qty: Number(Number(item.qty || 0).toFixed(3)) }))
    .filter((item) => item.qty > 0);
  if (requested.length === 0) return { ok: false as const, message: "Enter at least one return quantity." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.materialIssue.findFirst({
        where: { id: input.materialIssueId, status: "FINALIZED" },
        select: {
          id: true,
          issueNo: true,
          issueFy: true,
          issuedToNameSnapshot: true,
          issuedToEmployeeId: true,
          items: {
            select: { id: true, rawMaterialId: true, title: true, unit: true, qtyIssued: true, qtyReturned: true },
          },
        },
      });
      if (!issue) throw new Error("Material issue is not available for return.");

      const issueItems = new Map(issue.items.map((item) => [item.id, item]));
      const seen = new Set<string>();
      const prepared = requested.map((row, index) => {
        if (seen.has(row.materialIssueItemId)) throw new Error("A material issue row can only appear once.");
        seen.add(row.materialIssueItemId);
        const source = issueItems.get(row.materialIssueItemId);
        if (!source?.rawMaterialId) throw new Error(`Invalid return item at row ${index + 1}.`);
        const pending = Number(source.qtyIssued) - Number(source.qtyReturned);
        if (row.qty > pending) throw new Error(`${source.title}: return quantity exceeds pending quantity ${pending}.`);
        return { ...row, source, sortOrder: index };
      });

      const fy = getFinancialYearLabel(returnDate);
      const counter = await tx.fiscalCounter.upsert({
        where: { key: `MATERIAL_RETURN:${fy}` },
        create: { key: `MATERIAL_RETURN:${fy}`, value: 1 },
        update: { value: { increment: 1 } },
        select: { value: true },
      });
      const created = await tx.materialReturn.create({
        data: {
          returnNo: counter.value,
          returnFy: fy,
          status: "FINALIZED",
          returnDate,
          materialIssueId: issue.id,
          returnedByEmployeeId: issue.issuedToEmployeeId,
          returnedByNameSnapshot: issue.issuedToNameSnapshot,
          receivedByNameSnapshot: input.receivedByName?.trim() || session.user.name || session.user.email,
          remarks: input.remarks?.trim() || null,
          finalizedAt: new Date(),
          finalizedById: session.user.id,
          createdById: session.user.id,
          updatedById: session.user.id,
        },
      });

      for (const row of prepared) {
        await tx.materialReturnItem.create({
          data: {
            materialReturnId: created.id,
            materialIssueItemId: row.source.id,
            rawMaterialId: row.source.rawMaterialId!,
            title: row.source.title,
            unit: row.source.unit,
            qty: row.qty,
            condition: row.condition,
            remarks: row.remarks?.trim() || null,
            sortOrder: row.sortOrder,
          },
        });
        await tx.materialIssueItem.update({
          where: { id: row.source.id },
          data: { qtyReturned: { increment: row.qty } },
        });
        if (row.condition === "REUSABLE") {
          await postStockMovement(tx, {
            rawMaterialId: row.source.rawMaterialId,
            movementType: "RETURN_IN",
            referenceType: "MATERIAL_RETURN",
            referenceId: created.id,
            referenceNo: `${fy}-${counter.value}`,
            qty: row.qty,
            movementDate: returnDate,
            actorName: issue.issuedToNameSnapshot,
            remarks: `Reusable return against ${issue.issueFy}-${issue.issueNo} (${row.source.title})`,
            createdById: session.user.id,
          });
        }
      }
      return created;
    }, FINALIZE_TRANSACTION_OPTIONS);

    revalidatePath("/dashboard/inventory/returns");
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");
    revalidatePath(`/dashboard/manufacturing/material-issues/${input.materialIssueId}`);
    return { ok: true as const, id: result.id, message: "Material return finalized." };
  } catch (error: unknown) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Failed to record material return.",
    };
  }
}
