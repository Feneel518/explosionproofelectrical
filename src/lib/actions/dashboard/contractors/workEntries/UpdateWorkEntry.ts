"use server";

import { withSerializableRetry } from "@/lib/prisma/withSerializableRetry";
import { assertPayrollPeriodOpen } from "@/lib/contractors/periodLock";
import { requirePermission } from "@/lib/check/permissions";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  WorkEntrySchema,
  WorkEntrySchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkEntryValidator";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export const updateWorkEntryAction = async (values: WorkEntrySchemaRequest) => {
  const session = await requirePermission("production.write");

  const parsed = WorkEntrySchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Enter the fields properly." };
  const data = parsed.data;
  if (!data.id) return fail("Entry id is required.");
  if (!data.date) return fail("A valid date is required.");
  const entryDate = data.date;

  try {
    const rateRow = await prisma.contractorRate.findFirst({
      where: { id: data.contractorRateId, deletedAt: null },
      select: {
        id: true,
        defaultRate: true,
        sideLabel: true,
        unit: true,
        contractorProduct: { select: { name: true } },
        contractorOperation: { select: { name: true } },
      },
    });
    if (!rateRow) return fail("Selected rate row not found.");

    const updated = await withSerializableRetry(async tx => {
      const existing = await tx.workEntry.findUniqueOrThrow({ where: { id: data.id } });
      for (const workerId of [...new Set([existing.workerId, data.workerId])].sort()) { await assertPayrollPeriodOpen(tx, workerId, existing.date); await assertPayrollPeriodOpen(tx, workerId, entryDate); }
      return tx.workEntry.update({
      where: { id: data.id },
      data: {
        date: entryDate,
        workerId: data.workerId,
        contractorRateId: data.contractorRateId,
        productNameSnapshot: rateRow.contractorProduct.name,
        operationNameSnapshot: rateRow.contractorOperation.name,
        sideLabelSnapshot: rateRow.sideLabel,
        unitSnapshot: rateRow.unit,
        qty: data.qty,
        rate: rateRow.defaultRate,
        amount: new Prisma.Decimal(
          Number((data.qty * Number(rateRow.defaultRate)).toFixed(2)),
        ),
        notes: data.notes || null,
        updatedById: session.user.id,
      },
      select: { id: true, workerId: true },
    });
    });

    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${updated.workerId}`);
    return { ok: true, message: "Entry updated.", data: updated };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to update entry.");
  }
};

export const softDeleteWorkEntryAction = async (entryId: string) => {
  const session = await requirePermission("production.write");
  if (!entryId) return { ok: false, message: "No entry id provided." };

  try {
    const e = await withSerializableRetry(async tx => {
      const existing = await tx.workEntry.findUniqueOrThrow({ where: { id: entryId } });
      await assertPayrollPeriodOpen(tx, existing.workerId, existing.date);
      return tx.workEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date(), deletedById: session.user.id },
      select: { workerId: true },
    });
    });
    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${e.workerId}`);
    return { ok: true, message: "Entry deleted." };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to delete entry.");
  }
};

export const restoreWorkEntryAction = async (entryId: string) => {
  await requirePermission("production.write");
  if (!entryId) return { ok: false, message: "No entry id provided." };
  try {
    const e = await withSerializableRetry(async tx => {
      const existing = await tx.workEntry.findUniqueOrThrow({ where: { id: entryId } });
      await assertPayrollPeriodOpen(tx, existing.workerId, existing.date);
      return tx.workEntry.update({
      where: { id: entryId },
      data: { deletedAt: null, deletedById: null },
      select: { workerId: true },
    });
    });
    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${e.workerId}`);
    return { ok: true, message: "Entry restored." };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to restore entry.");
  }
};
