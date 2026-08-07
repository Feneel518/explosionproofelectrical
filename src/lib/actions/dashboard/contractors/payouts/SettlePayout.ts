"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  SettlePayoutSchema,
  SettlePayoutSchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkerLedgerValidator";
import { revalidatePath } from "next/cache";

const monthRange = (monthYear: string) => {
  const [y, m] = monthYear.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
};

export const settlePayoutAction = async (values: SettlePayoutSchemaRequest) => {
  const session = await requireAuth();

  const parsed = SettlePayoutSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Enter the fields properly." };
  const data = parsed.data;

  const { start, end } = monthRange(data.monthYear);

  try {
    const [entries, castingEntries] = await Promise.all([
      prisma.workEntry.aggregate({
        where: {
          workerId: data.workerId,
          deletedAt: null,
          date: { gte: start, lt: end },
        },
        _sum: { amount: true, qty: true },
      }),
      prisma.castingJobReceiptItem.aggregate({
        where: {
          castingJobReceipt: {
            receivedAt: { gte: start, lt: end },
            castingJob: { workerId: data.workerId },
          },
        },
        _sum: { laborAmount: true, receivedWeightKg: true },
      }),
    ]);

    const ledger = await prisma.workerLedgerEntry.findMany({
      where: {
        workerId: data.workerId,
        deletedAt: null,
        date: { gte: start, lt: end },
        kind: { in: ["ADVANCE", "DEDUCTION", "BONUS", "ADJUSTMENT"] },
      },
      select: { id: true, kind: true, amount: true },
    });

    const advances = ledger
      .filter((l) => l.kind === "ADVANCE")
      .reduce((s, l) => s + Number(l.amount), 0);
    const deductions = ledger
      .filter((l) => l.kind === "DEDUCTION" || l.kind === "ADJUSTMENT")
      .reduce((s, l) => s + Number(l.amount), 0);
    const bonus = ledger
      .filter((l) => l.kind === "BONUS")
      .reduce((s, l) => s + Number(l.amount), 0);

    const earnings =
      Number(entries._sum.amount ?? 0) +
      Number(castingEntries._sum.laborAmount ?? 0);

    const advanceApplied = data.applyAdvances ? advances : 0;
    const netPayable = Math.max(0, earnings + bonus - advanceApplied - deductions);
    const carryForward = data.applyAdvances ? 0 : advances; // unsettled advance carried over
    const amountPaid = data.amountPaid ?? 0;

    const payout = await prisma.workerPayout.upsert({
      where: { workerId_monthYear: { workerId: data.workerId, monthYear: data.monthYear } },
      create: {
        workerId: data.workerId,
        monthYear: data.monthYear,
        earningsTotal: earnings,
        advancesTotal: advances,
        deductionsTotal: deductions,
        bonusTotal: bonus,
        netPayable,
        amountPaid,
        carryForward,
        applyAdvances: data.applyAdvances ?? true,
        paidAt: amountPaid > 0 ? new Date() : null,
        notes: data.notes || null,
        createdById: session.user.id,
      },
      update: {
        earningsTotal: earnings,
        advancesTotal: advances,
        deductionsTotal: deductions,
        bonusTotal: bonus,
        netPayable,
        amountPaid,
        carryForward,
        applyAdvances: data.applyAdvances ?? true,
        paidAt: amountPaid > 0 ? new Date() : null,
        notes: data.notes || null,
        updatedById: session.user.id,
      },
      select: { id: true },
    });

    await prisma.workerLedgerEntry.deleteMany({
      where: {
        payoutId: payout.id,
        kind: "PAYOUT",
      },
    });

    if (amountPaid > 0) {
      await prisma.workerLedgerEntry.create({
        data: {
          workerId: data.workerId,
          date: new Date(),
          kind: "PAYOUT",
          amount: amountPaid,
          notes: `Payout for ${data.monthYear}`,
          payoutId: payout.id,
          createdById: session.user.id,
        },
      });
    }

    revalidatePath("/dashboard/contractors/payouts");
    revalidatePath(`/dashboard/contractors/workers/${data.workerId}`);
    return {
      ok: true,
      message: "Payout settled.",
      data: { id: payout.id, netPayable, earnings, advances, deductions, bonus },
    };
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : "Failed to settle payout.");
  }
};
