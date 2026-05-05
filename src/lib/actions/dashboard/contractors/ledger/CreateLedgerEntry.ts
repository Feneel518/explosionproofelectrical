"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  WorkerLedgerSchema,
  WorkerLedgerSchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkerLedgerValidator";
import { revalidatePath } from "next/cache";

export const createLedgerEntryAction = async (
  values: WorkerLedgerSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = WorkerLedgerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Enter the fields properly." };
  const data = parsed.data;
  if (!data.date) return fail("A valid date is required.");
  const ledgerDate = data.date;

  // PAYOUT records are usually generated automatically, but allow manual ones.
  try {
    const created = await prisma.workerLedgerEntry.create({
      data: {
        workerId: data.workerId,
        date: ledgerDate,
        kind: data.kind,
        amount: data.amount,
        notes: data.notes || null,
        createdById: session.user.id,
      },
      select: { id: true },
    });

    revalidatePath(`/dashboard/contractors/workers/${data.workerId}`);
    revalidatePath("/dashboard/contractors/payouts");
    return { ok: true, message: "Ledger entry added.", data: created };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to add ledger entry.");
  }
};

export const updateLedgerEntryAction = async (
  values: WorkerLedgerSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = WorkerLedgerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Enter the fields properly." };
  const data = parsed.data;
  if (!data.id) return fail("Ledger id is required.");
  if (!data.date) return fail("A valid date is required.");
  const ledgerDate = data.date;

  try {
    const updated = await prisma.workerLedgerEntry.update({
      where: { id: data.id },
      data: {
        date: ledgerDate,
        kind: data.kind,
        amount: data.amount,
        notes: data.notes || null,
        updatedById: session.user.id,
      },
      select: { id: true, workerId: true },
    });

    revalidatePath(`/dashboard/contractors/workers/${updated.workerId}`);
    revalidatePath("/dashboard/contractors/payouts");
    return { ok: true, message: "Ledger entry updated." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to update ledger entry.");
  }
};

export const softDeleteLedgerEntryAction = async (id: string) => {
  const session = await requireAuth();
  if (!id) return { ok: false, message: "No id provided." };
  try {
    const e = await prisma.workerLedgerEntry.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: session.user.id },
      select: { workerId: true },
    });
    revalidatePath(`/dashboard/contractors/workers/${e.workerId}`);
    revalidatePath("/dashboard/contractors/payouts");
    return { ok: true, message: "Ledger entry removed." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to remove ledger entry.");
  }
};
