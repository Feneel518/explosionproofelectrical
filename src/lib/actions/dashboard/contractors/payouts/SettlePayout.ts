"use server";

import { requirePermission } from "@/lib/check/permissions";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { SettlePayoutSchema, type SettlePayoutSchemaRequest } from "@/lib/validators/dashboard/contractors/WorkerLedgerValidator";
import { withSerializableRetry } from "@/lib/prisma/withSerializableRetry";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { calculatePayoutAmounts, payrollMonthBounds } from "@/lib/contractors/payoutAmounts";

export const settlePayoutAction = async (values: SettlePayoutSchemaRequest) => {
  const session = await requirePermission("accounts.write");
  const parsed = SettlePayoutSchema.safeParse(values);
  if (!parsed.success) return fail("Enter a valid month and payment amount.");
  const data = parsed.data;
  const { start, end } = payrollMonthBounds(data.monthYear);
  const amount = (value: Prisma.Decimal | number | null | undefined) => new Prisma.Decimal(value ?? 0);
  try {
    const result = await withSerializableRetry(async tx => {
      const lock = `payroll:${data.workerId}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 0))`;
      const worker = await tx.worker.findFirst({ where: { id: data.workerId, deletedAt: null }, select: { id: true } });
      if (!worker) throw new Error("Worker not found.");
      const later = await tx.workerPayout.findFirst({ where: { workerId: data.workerId, monthYear: { gt: data.monthYear } }, select: { monthYear: true } });
      if (later) throw new Error(`A later month (${later.monthYear}) is settled. Reconcile that settlement before changing this month.`);
      const [existing, previous, work, casting, advancesLedger, applied, ledger] = await Promise.all([
        tx.workerPayout.findUnique({ where: { workerId_monthYear: { workerId: data.workerId, monthYear: data.monthYear } } }),
        tx.workerPayout.findFirst({ where: { workerId: data.workerId, monthYear: { lt: data.monthYear } }, orderBy: { monthYear: "desc" } }),
        tx.workEntry.aggregate({ where: { workerId: data.workerId, deletedAt: null, date: { gte: start, lt: end } }, _sum: { amount: true } }),
        tx.castingJobReceiptItem.aggregate({ where: { castingJobReceipt: { receivedAt: { gte: start, lt: end }, castingJob: { workerId: data.workerId } } }, _sum: { laborAmount: true } }),
        tx.workerLedgerEntry.aggregate({ where: { workerId: data.workerId, deletedAt: null, kind: "ADVANCE", date: { lt: end } }, _sum: { amount: true } }),
        tx.workerPayout.aggregate({ where: { workerId: data.workerId, monthYear: { lt: data.monthYear } }, _sum: { advanceApplied: true } }),
        tx.workerLedgerEntry.findMany({ where: { workerId: data.workerId, deletedAt: null, date: { gte: start, lt: end }, kind: { in: ["DEDUCTION", "BONUS", "ADJUSTMENT"] } }, select: { kind: true, amount: true } }),
      ]);
      const sum = (kind: string[]) => ledger.filter(row => kind.includes(row.kind)).reduce((total, row) => total.plus(row.amount), amount(0));
      const earnings = amount(work._sum.amount).plus(amount(casting._sum.laborAmount));
      const deductions = sum(["DEDUCTION", "ADJUSTMENT"]), bonus = sum(["BONUS"]);
      const { advances, advanceApplied, netPayable } = calculatePayoutAmounts({
        earnings, deductions, bonus, lifetimeAdvances: advancesLedger._sum.amount,
        priorAdvanceApplied: applied._sum.advanceApplied, priorUnpaidWages: previous?.unpaidWagesForward, applyAdvances: data.applyAdvances,
      });
      const amountPaid = amount(data.amountPaid).toDecimalPlaces(2);
      const previousPaid = amount(existing?.amountPaid);
      if (amountPaid.lessThan(previousPaid)) throw new Error("A recorded payment cannot be reduced. Record a separate authorized reversal instead.");
      if (amountPaid.greaterThan(netPayable)) throw new Error("Payment exceeds the amount payable. Record an advance separately.");
      const delta = amountPaid.minus(previousPaid);
      const totals = { earningsTotal: earnings, advancesTotal: advances, deductionsTotal: deductions, bonusTotal: bonus,
        advanceApplied, netPayable, amountPaid, carryForward: advances.minus(advanceApplied), unpaidWagesForward: netPayable.minus(amountPaid),
        applyAdvances: data.applyAdvances, paidAt: delta.greaterThan(0) ? new Date() : existing?.paidAt ?? null, notes: data.notes || null };
      const payout = await tx.workerPayout.upsert({ where: { workerId_monthYear: { workerId: data.workerId, monthYear: data.monthYear } },
        create: { workerId: data.workerId, monthYear: data.monthYear, ...totals, createdById: session.user.id },
        update: { ...totals, updatedById: session.user.id }, select: { id: true } });
      if (delta.greaterThan(0)) await tx.workerLedgerEntry.create({ data: { workerId: data.workerId, date: new Date(), kind: "PAYOUT", amount: delta, notes: `Payment against ${data.monthYear}`, payoutId: payout.id, createdById: session.user.id } });
      return { id: payout.id, netPayable: netPayable.toNumber(), earnings: earnings.toNumber(), advances: advances.toNumber(), deductions: deductions.toNumber(), bonus: bonus.toNumber() };
    });
    revalidatePath("/dashboard/contractors/payouts");
    revalidatePath(`/dashboard/contractors/workers/${data.workerId}`);
    return { ok: true as const, message: "Payout settled.", data: result };
  } catch (error) { return fail(error instanceof Error ? error.message : "Failed to settle payout."); }
};
