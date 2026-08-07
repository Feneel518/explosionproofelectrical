import MonthlyPayoutsManager from "@/components/dashboard/contractors/MonthlyPayoutsManager";
import {
  buildPayoutOrderBy,
  buildPayoutWhere,
} from "@/lib/helpers/RepoHelpers/ContractorRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";
import { payoutsSearchParamsCache } from "@/lib/searchParams/dashboard/contractors/payoutsSearchParams";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const castingMode = raw.workforce === "casting";
  const sp = payoutsSearchParamsCache.parse(raw);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthYear = sp.monthYear || currentMonth;

  const [workers, payouts] = await Promise.all([
    prisma.worker.findMany({
      where: { deletedAt: null, status: "ACTIVE", kind: castingMode ? "CASTING" : "MACHINING" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.workerPayout.findMany({
      where: {
        AND: [
          buildPayoutWhere({ ...sp, monthYear }),
          { worker: { kind: castingMode ? "CASTING" : "MACHINING" } },
        ],
      },
      orderBy: buildPayoutOrderBy({ ...sp, monthYear }),
      take: 100,
      select: {
        id: true,
        monthYear: true,
        earningsTotal: true,
        netPayable: true,
        amountPaid: true,
        paidAt: true,
        worker: { select: { name: true } },
      },
    }),
  ]);

  let summary: {
    monthYear: string;
    workerId: string;
    earnings: number;
    advances: number;
    deductions: number;
    bonus: number;
    adjustments: number;
    netPayable: number;
    amountPaid: number;
    applyAdvances: boolean;
    notes: string;
  } | null = null;
  let ledgerRows: {
    id: string;
    date: Date;
    kind: string;
    amount: number;
    notes: string | null;
  }[] = [];
  let historyRows: {
    id: string;
    date: Date;
    productNameSnapshot: string;
    operationNameSnapshot: string;
    sideLabelSnapshot: string | null;
    qty: number;
    rate: number;
    amount: number;
    notes: string | null;
  }[] = [];
  let selectedWorkerName = "";

  if (sp.workerId) {
    const [year, month] = monthYear.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [entryAgg, castingAgg, entries, ledger, existingPayout, worker] = await Promise.all([
      prisma.workEntry.aggregate({
        where: {
          workerId: sp.workerId,
          deletedAt: null,
          date: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.castingJobReceiptItem.aggregate({
        where: {
          castingJobReceipt: {
            receivedAt: { gte: start, lt: end },
            castingJob: { workerId: sp.workerId },
          },
        },
        _sum: { laborAmount: true, receivedWeightKg: true },
      }),
      prisma.workEntry.findMany({
        where: {
          workerId: sp.workerId,
          deletedAt: null,
          date: { gte: start, lt: end },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          date: true,
          productNameSnapshot: true,
          operationNameSnapshot: true,
          sideLabelSnapshot: true,
          qty: true,
          rate: true,
          amount: true,
          notes: true,
        },
      }),
      prisma.workerLedgerEntry.findMany({
        where: {
          workerId: sp.workerId,
          deletedAt: null,
          date: { gte: start, lt: end },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          date: true,
          kind: true,
          amount: true,
          notes: true,
        },
      }),
      prisma.workerPayout.findUnique({
        where: { workerId_monthYear: { workerId: sp.workerId, monthYear } },
        select: {
          amountPaid: true,
          applyAdvances: true,
          notes: true,
        },
      }),
      prisma.worker.findUnique({
        where: { id: sp.workerId },
        select: { name: true },
      }),
    ]);

    const sumByKind = (kind: string) =>
      ledger
        .filter((row) => row.kind === kind)
        .reduce((sum, row) => sum + Number(row.amount), 0);

    const earnings =
      Number(entryAgg._sum.amount ?? 0) + Number(castingAgg._sum.laborAmount ?? 0);
    const advances = sumByKind("ADVANCE");
    const deductions = sumByKind("DEDUCTION");
    const adjustments = sumByKind("ADJUSTMENT");
    const bonus = sumByKind("BONUS");
    const applyAdvances = existingPayout?.applyAdvances ?? true;
    const advanceApplied = applyAdvances ? advances : 0;

    summary = {
      monthYear,
      workerId: sp.workerId,
      earnings,
      advances,
      deductions,
      adjustments,
      bonus,
      netPayable: Math.max(0, earnings + bonus - deductions - adjustments - advanceApplied),
      amountPaid: Number(existingPayout?.amountPaid ?? 0),
      applyAdvances,
      notes: existingPayout?.notes ?? "",
    };

    ledgerRows = ledger.map((row) => ({
      id: row.id,
      date: row.date,
      kind: row.kind,
      amount: Number(row.amount),
      notes: row.notes,
    }));
    historyRows = entries.map((row) => ({
      id: row.id,
      date: row.date,
      productNameSnapshot: row.productNameSnapshot,
      operationNameSnapshot: row.operationNameSnapshot,
      sideLabelSnapshot: row.sideLabelSnapshot,
      qty: row.qty,
      rate: Number(row.rate),
      amount: Number(row.amount),
      notes: row.notes,
    }));
    selectedWorkerName = worker?.name ?? "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {castingMode ? "Casting Worker Payroll" : "Monthly Payouts"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {castingMode
            ? "Pay casting workers from accepted casting weight and saved worker-casting rates."
            : "Track advances, deductions, bonuses, and close each worker month with a saved payout record."}
        </p>
      </div>

      <MonthlyPayoutsManager
        workers={serializeForClient(workers)}
        qp={{ ...sp, monthYear }}
        selectedWorkerName={selectedWorkerName}
        summary={serializeForClient(summary)}
        historyRows={serializeForClient(historyRows)}
        ledgerRows={serializeForClient(ledgerRows)}
        payouts={serializeForClient(
          payouts.map((payout) => ({
            id: payout.id,
            monthYear: payout.monthYear,
            workerName: payout.worker.name,
            earningsTotal: Number(payout.earningsTotal),
            netPayable: Number(payout.netPayable),
            amountPaid: Number(payout.amountPaid),
            paidAt: payout.paidAt,
          })),
        )}
      />
    </div>
  );
}
