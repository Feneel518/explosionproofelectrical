import DailyEntriesManager from "@/components/dashboard/contractors/DailyEntriesManager";
import EntriesFilters from "@/components/dashboard/contractors/EntriesFilters";
import {
  buildWorkEntryOrderBy,
  buildWorkEntryWhere,
} from "@/lib/helpers/RepoHelpers/ContractorRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";
import { workEntriesSearchParamsCache } from "@/lib/searchParams/dashboard/contractors/workEntriesSearchParams";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp = workEntriesSearchParamsCache.parse(raw);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const effectiveSp = {
    ...sp,
    monthYear: sp.monthYear || currentMonth,
  };

  const [workers, rates, entries] = await Promise.all([
    prisma.worker.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, role: true },
    }),
    prisma.contractorRate.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: [
        { contractorProduct: { name: "asc" } },
        { contractorOperation: { name: "asc" } },
        { sideLabel: "asc" },
      ],
      select: {
        id: true,
        sideLabel: true,
        unit: true,
        defaultRate: true,
        role: true,
        contractorProduct: { select: { name: true } },
        contractorOperation: { select: { name: true } },
      },
    }),
    prisma.workEntry.findMany({
      where: buildWorkEntryWhere(effectiveSp),
      orderBy: [buildWorkEntryOrderBy(effectiveSp), { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        date: true,
        workerId: true,
        worker: { select: { name: true } },
        productNameSnapshot: true,
        operationNameSnapshot: true,
        sideLabelSnapshot: true,
        unitSnapshot: true,
        qty: true,
        rate: true,
        amount: true,
        notes: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daily Entries</h1>
        <p className="text-sm text-muted-foreground">
          Enter one worker and one date, then record multiple piece-rate rows underneath.
        </p>
      </div>

      <EntriesFilters
        workers={serializeForClient(
          workers.map((worker) => ({ id: worker.id, name: worker.name, code: worker.code })),
        )}
        qp={effectiveSp}
      />

      <DailyEntriesManager
        workers={serializeForClient(workers)}
        rates={serializeForClient(
          rates.map((rate) => ({
            id: rate.id,
            productName: rate.contractorProduct.name,
            operationName: rate.contractorOperation.name,
            sideLabel: rate.sideLabel,
            unit: rate.unit,
            defaultRate: Number(rate.defaultRate),
            role: rate.role,
          })),
        )}
        entries={serializeForClient(
          entries.map((entry) => ({
            id: entry.id,
            date: entry.date,
            workerId: entry.workerId,
            workerName: entry.worker.name,
            productNameSnapshot: entry.productNameSnapshot,
            operationNameSnapshot: entry.operationNameSnapshot,
            sideLabelSnapshot: entry.sideLabelSnapshot,
            unitSnapshot: entry.unitSnapshot,
            qty: entry.qty,
            rate: Number(entry.rate),
            amount: Number(entry.amount),
            notes: entry.notes,
          })),
        )}
        initialWorkerId={effectiveSp.workerId}
        initialDate={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}
