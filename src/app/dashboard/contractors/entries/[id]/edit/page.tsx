import { notFound } from "next/navigation";

import WorkEntryEditForm from "@/components/dashboard/contractors/WorkEntryEditForm";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const entry = await prisma.workEntry.findUnique({
    where: { id },
    select: {
      id: true,
      workerId: true,
      contractorRateId: true,
      date: true,
      qty: true,
      notes: true,
    },
  });

  if (!entry) notFound();

  const [workers, rates] = await Promise.all([
    prisma.worker.findMany({
      where: { deletedAt: null, status: "ACTIVE", kind: "MACHINING" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.contractorRate.findMany({
      where: { deletedAt: null },
      orderBy: [
        { contractorProduct: { name: "asc" } },
        { contractorOperation: { name: "asc" } },
      ],
      select: {
        id: true,
        sideLabel: true,
        unit: true,
        defaultRate: true,
        contractorProduct: { select: { name: true } },
        contractorOperation: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Daily Entry</h1>
        <p className="text-sm text-muted-foreground">
          Update the worker, rate row, quantity, or notes for this piece-rate record.
        </p>
      </div>

      <WorkEntryEditForm
        workers={serializeForClient(workers)}
        rates={serializeForClient(
          rates.map((rate) => ({
            id: rate.id,
            productName: rate.contractorProduct.name,
            operationName: rate.contractorOperation.name,
            sideLabel: rate.sideLabel,
            unit: rate.unit,
            defaultRate: Number(rate.defaultRate),
          })),
        )}
        entry={serializeForClient({
          ...entry,
          date: entry.date.toISOString().slice(0, 10),
        })}
      />
    </div>
  );
}
