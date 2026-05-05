"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  WorkEntryBatchSchema,
  WorkEntryBatchSchemaRequest,
  WorkEntrySchema,
  WorkEntrySchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkEntryValidator";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export const createWorkEntryAction = async (values: WorkEntrySchemaRequest) => {
  const session = await requireAuth();

  const parsed = WorkEntrySchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Enter the fields properly." };
  const data = parsed.data;
  if (!data.date) return fail("A valid date is required.");
  const entryDate = data.date;

  try {
    const rateRow = await prisma.contractorRate.findFirst({
      where: { id: data.contractorRateId, deletedAt: null, status: "ACTIVE" },
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

    const created = await prisma.workEntry.create({
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
        createdById: session.user.id,
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${data.workerId}`);
    return { ok: true, message: "Entry recorded.", data: created };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to record entry.");
  }
};

export const createWorkEntryBatchAction = async (
  values: WorkEntryBatchSchemaRequest,
) => {
  const session = await requireAuth();
  const parsed = WorkEntryBatchSchema.safeParse(values);

  if (!parsed.success) return fail("Enter the fields properly.");
  const data = parsed.data;
  if (!data.date) return fail("A valid date is required.");
  const entryDate = data.date;

  try {
    const rateIds = [...new Set(data.rows.map((row) => row.contractorRateId))];
    const rateRows = await prisma.contractorRate.findMany({
      where: {
        id: { in: rateIds },
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        defaultRate: true,
        sideLabel: true,
        unit: true,
        contractorProduct: { select: { name: true } },
        contractorOperation: { select: { name: true } },
      },
    });

    const rateMap = new Map(rateRows.map((row) => [row.id, row]));

    if (rateMap.size !== rateIds.length) {
      return fail("One or more selected rate rows are no longer active.");
    }

    await prisma.workEntry.createMany({
      data: data.rows.map((row) => {
        const rateRow = rateMap.get(row.contractorRateId)!;
        const rate = Number(rateRow.defaultRate);
        return {
          date: entryDate,
          workerId: data.workerId,
          contractorRateId: row.contractorRateId,
          productNameSnapshot: rateRow.contractorProduct.name,
          operationNameSnapshot: rateRow.contractorOperation.name,
          sideLabelSnapshot: rateRow.sideLabel,
          unitSnapshot: rateRow.unit,
          qty: row.qty,
          rate: new Prisma.Decimal(rate),
          amount: new Prisma.Decimal(Number((row.qty * rate).toFixed(2))),
          notes: row.notes || null,
          createdById: session.user.id,
        };
      }),
    });

    revalidatePath("/dashboard/contractors/entries");
    revalidatePath(`/dashboard/contractors/workers/${data.workerId}`);
    revalidatePath("/dashboard/contractors/payouts");
    return { ok: true, message: `${data.rows.length} work row(s) added.` };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to record work rows.");
  }
};
