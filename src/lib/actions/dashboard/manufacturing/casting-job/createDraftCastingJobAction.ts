"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export type CastingJobDraftData = {
  header: {
    issueDate?: string | null;
    expectedReturnDate?: string | null;
    workerType?: "IN_HOUSE" | "JOB_WORK" | "CONTRACT";
    workerId?: string | null;
    workerName?: string | null;
    supplierId?: string | null;
    supplierName?: string | null;
    remarks?: string | null;
  };
  items: Array<{
    id: string;
    inputRawMaterialId: string | null;
    outputCastingId: string | null;
    inputTitle: string;
    outputTitle: string;
    inputUnit?: string | null;
    outputUnit?: string | null;
    issuedQty: number;
    issuedWeightKg: number;
    sortOrder: number;
  }>;
};

export async function createDraftCastingJobAction(workerId?: string | null) {
  const session = await requireAuth();
  const fy = getFinancialYearLabel(new Date());
  const worker = workerId
    ? await prisma.worker.findFirst({
        where: { id: workerId, status: "ACTIVE", deletedAt: null },
        select: { id: true, name: true },
      })
    : null;

  const counter = await prisma.fiscalCounter.upsert({
    where: { key: `CASTING_JOB:${fy}` },
    create: { key: `CASTING_JOB:${fy}`, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });

  const emptyDraft: CastingJobDraftData = {
    header: {
      issueDate: new Date().toISOString(),
      expectedReturnDate: null,
      workerType: "IN_HOUSE",
      workerId: worker?.id ?? null,
      workerName: worker?.name ?? "",
      supplierId: null,
      supplierName: null,
      remarks: "",
    },
    items: [],
  };

  const created = await prisma.castingJob.create({
    data: {
      jobNo: counter.value,
      jobFy: fy,
      status: "DRAFT",
      workerType: "IN_HOUSE",
      workerNameSnapshot: "Draft",
      draftData: emptyDraft,
      draftVersion: 0,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true },
  });

  return { ok: true as const, id: created.id };
}
