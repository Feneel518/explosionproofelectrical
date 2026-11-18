"use server";
import { requirePermission } from "@/lib/check/permissions";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { withSerializableRetry } from "@/lib/prisma/withSerializableRetry";
import { assertPayrollPeriodOpen } from "@/lib/contractors/periodLock";
import { WorkerLedgerSchema, type WorkerLedgerSchemaRequest } from "@/lib/validators/dashboard/contractors/WorkerLedgerValidator";
import { revalidatePath } from "next/cache";

function refresh(workerId: string) { revalidatePath(`/dashboard/contractors/workers/${workerId}`); revalidatePath("/dashboard/contractors/payouts"); }
export async function createLedgerEntryAction(values: WorkerLedgerSchemaRequest) {
  const { user } = await requirePermission("accounts.write");
  const parsed = WorkerLedgerSchema.safeParse(values);
  if (!parsed.success || !parsed.data.date) return fail("Enter a valid worker, date and amount.");
  const data = parsed.data;
  if (data.kind === "PAYOUT") return fail("Use monthly settlement to record a payment.");
  try {
    const created = await withSerializableRetry(async tx => {
      await assertPayrollPeriodOpen(tx, data.workerId, data.date!);
      return tx.workerLedgerEntry.create({ data: { workerId: data.workerId, date: data.date!, kind: data.kind, amount: data.amount, notes: data.notes || null, createdById: user.id }, select: { id: true } });
    });
    refresh(data.workerId); return { ok: true as const, message: "Ledger entry added.", data: created };
  } catch (error) { return fail(error instanceof Error ? error.message : "Failed to add ledger entry."); }
}
export async function updateLedgerEntryAction(values: WorkerLedgerSchemaRequest) {
  const { user } = await requirePermission("accounts.write");
  const parsed = WorkerLedgerSchema.safeParse(values);
  if (!parsed.success || !parsed.data.id || !parsed.data.date) return fail("Enter a valid entry, date and amount.");
  const data = parsed.data;
  if (data.kind === "PAYOUT") return fail("Payments are recorded only through monthly settlement.");
  try {
    const updated = await withSerializableRetry(async tx => {
      const existing = await tx.workerLedgerEntry.findUniqueOrThrow({ where: { id: data.id } });
      if (existing.payoutId || existing.kind === "PAYOUT") throw new Error("Payment history cannot be edited. Record a correction in an open month.");
      if (existing.workerId !== data.workerId) throw new Error("A ledger entry cannot be moved to another worker.");
      await assertPayrollPeriodOpen(tx, existing.workerId, existing.date);
      await assertPayrollPeriodOpen(tx, existing.workerId, data.date!);
      return tx.workerLedgerEntry.update({ where: { id: data.id }, data: { date: data.date!, kind: data.kind, amount: data.amount, notes: data.notes || null, updatedById: user.id }, select: { workerId: true } });
    });
    refresh(updated.workerId); return { ok: true as const, message: "Ledger entry updated." };
  } catch (error) { return fail(error instanceof Error ? error.message : "Failed to update ledger entry."); }
}
export async function softDeleteLedgerEntryAction(id: string) {
  const { user } = await requirePermission("accounts.write");
  try {
    const entry = await withSerializableRetry(async tx => {
      const existing = await tx.workerLedgerEntry.findUniqueOrThrow({ where: { id } });
      if (existing.payoutId || existing.kind === "PAYOUT") throw new Error("Payment history cannot be deleted. Record a correction in an open month.");
      await assertPayrollPeriodOpen(tx, existing.workerId, existing.date);
      return tx.workerLedgerEntry.update({ where: { id }, data: { deletedAt: new Date(), deletedById: user.id }, select: { workerId: true } });
    });
    refresh(entry.workerId); return { ok: true as const, message: "Ledger entry removed." };
  } catch (error) { return fail(error instanceof Error ? error.message : "Failed to remove ledger entry."); }
}
