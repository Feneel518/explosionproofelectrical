"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  WorkEntrySchema,
  WorkEntrySchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkEntryValidator";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export const updateWorkEntryAction = async (values: WorkEntrySchemaRequest) => {
  const session = await requireAuth();

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

    const updated = await prisma.workEntry.update({
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

    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${updated.workerId}`);
    return { ok: true, message: "Entry updated.", data: updated };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to update entry.");
  }
};

export const softDeleteWorkEntryAction = async (entryId: string) => {
  const session = await requireAuth();
  if (!entryId) return { ok: false, message: "No entry id provided." };

  try {
    const e = await prisma.workEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date(), deletedById: session.user.id },
      select: { workerId: true },
    });
    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${e.workerId}`);
    return { ok: true, message: "Entry deleted." };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to delete entry.");
  }
};

export const restoreWorkEntryAction = async (entryId: string) => {
  await requireAuth();
  if (!entryId) return { ok: false, message: "No entry id provided." };
  try {
    const e = await prisma.workEntry.update({
      where: { id: entryId },
      data: { deletedAt: null, deletedById: null },
      select: { workerId: true },
    });
    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${e.workerId}`);
    return { ok: true, message: "Entry restored." };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to restore entry.");
  }
};
