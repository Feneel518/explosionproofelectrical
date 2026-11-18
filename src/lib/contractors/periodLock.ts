import "server-only";
import type { Prisma } from "@prisma/client";

export async function assertPayrollPeriodOpen(tx: Prisma.TransactionClient, workerId: string, date: Date) {
  const key = `payroll:${workerId}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid entry date.");
  const monthYear = new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 7);
  const settled = await tx.workerPayout.findFirst({ where: { workerId, monthYear: { gte: monthYear } }, select: { monthYear: true } });
  if (settled) throw new Error(`Payroll through ${settled.monthYear} is settled. Record a correction in an open month instead.`);
}
