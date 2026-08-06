"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { CastingJobDraftData } from "./createDraftCastingJobAction";

function toInt(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function toDecimal3(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Number(n.toFixed(3));
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function trimOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function finalizeCastingJobAction(id: string) {
  const session = await requireAuth();

  const job = await prisma.castingJob.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      jobNo: true,
      jobFy: true,
      draftData: true,
    },
  });

  if (!job) {
    return { ok: false as const, message: "Casting job not found." };
  }

  if (job.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Only draft casting job can be finalized.",
    };
  }

  const draft = job.draftData as CastingJobDraftData | null;
  if (!draft) {
    return { ok: false as const, message: "Casting job draft data missing." };
  }

  const workerId = trimOrNull(draft.header.workerId);
  if (!workerId) {
    return { ok: false as const, message: "Select a worker from the worker master." };
  }

  if (!draft.items?.length) {
    return { ok: false as const, message: "Add at least one casting item." };
  }

  const workerType =
    draft.header.workerType === "JOB_WORK"
      ? "JOB_WORK"
      : draft.header.workerType === "CONTRACT"
        ? "CONTRACT"
        : "IN_HOUSE";

  const preparedItems: Array<{
    id: string;
    inputRawMaterialId: string;
    inputTitle: string;
    inputUnit: string | null;
    issuedQty: number;
    issuedWeightKg: number;
    sortOrder: number;
  }> = [];
  for (let index = 0; index < draft.items.length; index += 1) {
    const item = draft.items[index];
    const issuedQty = toInt(item.issuedQty, 0);
    const issuedWeightKg = toDecimal3(item.issuedWeightKg, 0);

    if (!item.inputRawMaterialId) {
      return {
        ok: false as const,
        message: `Select aluminum scrap or ingot at row ${index + 1}.`,
      };
    }
    if (issuedWeightKg <= 0) {
      return {
        ok: false as const,
        message: `Enter issued weight at row ${index + 1}.`,
      };
    }

    preparedItems.push({
      id: item.id || crypto.randomUUID(),
      inputRawMaterialId: item.inputRawMaterialId,
      inputTitle: (item.inputTitle || "Input Material").trim(),
      inputUnit: trimOrNull(item.inputUnit),
      issuedQty,
      issuedWeightKg,
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    });
  }

  const inputIds = Array.from(
    new Set(preparedItems.map((item) => item.inputRawMaterialId)),
  );
  const [inputMaterials, worker] = await Promise.all([
    prisma.rawMaterial.findMany({ where: { id: { in: inputIds } }, select: { id: true } }),
    prisma.worker.findFirst({
      where: { id: workerId, status: "ACTIVE", deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  if (!worker) {
    return { ok: false as const, message: "Selected worker is not active or no longer exists." };
  }

  const workerName = worker.name;

  if (inputMaterials.length !== inputIds.length) {
    return {
      ok: false as const,
      message: "One or more input raw materials do not exist.",
    };
  }

  const stockBalances = await prisma.stockBalance.findMany({
    where: { rawMaterialId: { in: inputIds } },
    select: { rawMaterialId: true, qtyOnHand: true },
  });

  const onHandByRawMaterialId = new Map<string, number>();
  for (const row of stockBalances) {
    if (!row.rawMaterialId) continue;
    onHandByRawMaterialId.set(row.rawMaterialId, Number(row.qtyOnHand || 0));
  }

  const requestedWeightByRawMaterialId = new Map<string, number>();
  for (const item of preparedItems) {
    const current = requestedWeightByRawMaterialId.get(item.inputRawMaterialId) ?? 0;
    requestedWeightByRawMaterialId.set(
      item.inputRawMaterialId,
      current + item.issuedWeightKg,
    );
  }

  for (const [rawMaterialId, requestedWeight] of requestedWeightByRawMaterialId) {
    const availableWeight = onHandByRawMaterialId.get(rawMaterialId) ?? 0;
    if (requestedWeight > availableWeight) {
      return {
        ok: false as const,
        message: `Issued weight cannot exceed available stock (requested ${requestedWeight.toFixed(3)} kg, available ${availableWeight.toFixed(3)} kg).`,
      };
    }
  }

  const issueDate = toDateOrNull(draft.header.issueDate) ?? new Date();
  const expectedReturnDate = toDateOrNull(draft.header.expectedReturnDate);

  const supplierId = trimOrNull(draft.header.supplierId);
  const supplier = supplierId
    ? await prisma.supplier.findFirst({
        where: { id: supplierId, deletedAt: null },
        select: { id: true },
      })
    : null;

  if (supplierId && !supplier) {
    return { ok: false as const, message: "Selected supplier does not exist." };
  }

  const totalIssuedQty = preparedItems.reduce((sum, item) => sum + item.issuedQty, 0);
  const totalIssuedWeightKg = Number(
    preparedItems.reduce((sum, item) => sum + item.issuedWeightKg, 0).toFixed(3),
  );

  const referenceNo = formatFinancialDocumentNumber(job.jobFy, job.jobNo);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.castingJob.update({
        where: { id: job.id },
        data: {
          status: "IN_PROGRESS",
          workerType,
          workerId: worker.id,
          workerNameSnapshot: workerName,
          supplierId: supplierId ?? null,
          issueDate,
          expectedReturnDate,
          remarks: trimOrNull(draft.header.remarks),
          finalizedAt: new Date(),
          finalizedById: session.user.id,
          updatedById: session.user.id,
          totalIssuedQty,
          totalIssuedWeightKg,
          totalReceivedQty: 0,
          totalReceivedWeightKg: 0,
          totalPendingWeightKg: totalIssuedWeightKg,
          yieldPercent: 0,
        },
      });

      await tx.castingJobItem.deleteMany({
        where: { castingJobId: job.id },
      });

      for (const item of preparedItems) {
        await tx.castingJobItem.create({
          data: {
            id: item.id,
            castingJobId: job.id,
            inputRawMaterialId: item.inputRawMaterialId,
            outputCastingId: null,
            inputTitle: item.inputTitle,
            outputTitle: "Select casting when receiving",
            inputUnit: item.inputUnit,
            outputUnit: null,
            issuedQty: item.issuedQty,
            issuedWeightKg: item.issuedWeightKg,
            expectedOutputQty: null,
            expectedOutputWeightKg: null,
            receivedQty: 0,
            receivedWeightKg: 0,
            pendingWeightKg: item.issuedWeightKg,
            sortOrder: item.sortOrder,
          },
        });

        await postStockMovement(tx, {
          rawMaterialId: item.inputRawMaterialId,
          movementType: "OUT",
          referenceType: "CASTING_JOB",
          referenceId: job.id,
          referenceNo,
          qty: item.issuedWeightKg,
          movementDate: issueDate,
          actorName: workerName,
          remarks: `Casting job issue (${item.inputTitle})`,
          createdById: session.user.id,
        });
      }
    }, FINALIZE_TRANSACTION_OPTIONS);
  } catch (error: any) {
    return {
      ok: false as const,
      message: error?.message || "Failed to finalize casting job.",
    };
  }

  revalidatePath("/dashboard/manufacturing/casting-jobs");
  revalidatePath(`/dashboard/manufacturing/casting-jobs/${id}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");

  return { ok: true as const, message: "Casting job started successfully." };
}
