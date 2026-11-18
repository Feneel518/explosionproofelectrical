import { Prisma } from "@prisma/client";

type Amount = Prisma.Decimal | number | null | undefined;
const decimal = (value: Amount) => new Prisma.Decimal(value ?? 0);

export function payrollMonthBounds(monthYear: string) {
  if (!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(monthYear)) throw new Error("Enter a valid payroll month.");
  const [year, month] = monthYear.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - 330 * 60_000),
    end: new Date(Date.UTC(year, month, 1) - 330 * 60_000),
  };
}

export function calculatePayoutAmounts(input: {
  earnings: Amount; bonus: Amount; deductions: Amount; lifetimeAdvances: Amount;
  priorAdvanceApplied: Amount; priorUnpaidWages: Amount; applyAdvances: boolean;
}) {
  const advances = Prisma.Decimal.max(0, decimal(input.lifetimeAdvances).minus(decimal(input.priorAdvanceApplied)));
  const available = Prisma.Decimal.max(0, decimal(input.earnings).plus(decimal(input.bonus)).plus(decimal(input.priorUnpaidWages)).minus(decimal(input.deductions)));
  const advanceApplied = input.applyAdvances ? Prisma.Decimal.min(advances, available) : decimal(0);
  return { advances, available, advanceApplied, netPayable: available.minus(advanceApplied) };
}
