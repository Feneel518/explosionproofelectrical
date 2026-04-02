"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { CastingJobDraftData } from "./createDraftCastingJobAction";

function normalizeDraftData(rawDraft: unknown): CastingJobDraftData {
  const draft = (rawDraft ?? {}) as any;

  const header = {
    issueDate: draft?.header?.issueDate ?? new Date().toISOString(),
    expectedReturnDate: draft?.header?.expectedReturnDate ?? null,
    workerType:
      draft?.header?.workerType === "JOB_WORK"
        ? "JOB_WORK"
        : draft?.header?.workerType === "CONTRACT"
          ? "CONTRACT"
          : "IN_HOUSE",
    workerName: draft?.header?.workerName ?? "",
    supplierId: draft?.header?.supplierId ?? null,
    supplierName: draft?.header?.supplierName ?? null,
    remarks: draft?.header?.remarks ?? "",
  } as CastingJobDraftData["header"];

  const items = Array.isArray(draft?.items)
    ? draft.items.map((item: any, index: number) => ({
        id: item?.id || crypto.randomUUID(),
        inputRawMaterialId: item?.inputRawMaterialId ?? null,
        outputCastingId:
          item?.outputCastingId ?? item?.outputRawMaterialId ?? null,
        inputTitle: item?.inputTitle ?? "",
        outputTitle: item?.outputTitle ?? "",
        inputUnit: item?.inputUnit ?? null,
        outputUnit: item?.outputUnit ?? null,
        issuedQty: Number(item?.issuedQty ?? 0) || 0,
        issuedWeightKg: Number(item?.issuedWeightKg ?? 0) || 0,
        expectedOutputQty:
          item?.expectedOutputQty == null
            ? null
            : Number(item.expectedOutputQty) || 0,
        expectedOutputWeightKg:
          item?.expectedOutputWeightKg == null
            ? null
            : Number(item.expectedOutputWeightKg) || 0,
        sortOrder: Number.isFinite(Number(item?.sortOrder))
          ? Number(item.sortOrder)
          : index,
      }))
    : [];

  return { header, items };
}

export async function getCastingJobDraftAction(id: string) {
  await requireAuth();

  const job = await prisma.castingJob.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      jobNo: true,
      jobFy: true,
      draftData: true,
      draftVersion: true,
    },
  });

  if (!job) {
    return { ok: false as const, message: "Casting job not found." };
  }

  if (job.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Casting job is not in draft state.",
    };
  }

  const draft = normalizeDraftData(job.draftData);

  return {
    ok: true as const,
    castingJobId: job.id,
    jobNo: job.jobNo,
    jobFy: job.jobFy,
    draft,
    draftVersion: job.draftVersion,
  };
}

