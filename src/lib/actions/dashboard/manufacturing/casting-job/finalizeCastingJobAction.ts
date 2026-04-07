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

  const workerName = trimOrNull(draft.header.workerName);
  if (!workerName) {
    return { ok: false as const, message: "Worker name is required." };
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

  const preparedItems = draft.items.map((item, index) => {
    const issuedQty = toInt(item.issuedQty, 0);
    const issuedWeightKg = toDecimal3(item.issuedWeightKg, 0);

    if (
      !item.inputRawMaterialId ||
      !item.outputCastingId ||
      issuedQty <= 0 ||
      issuedWeightKg <= 0
    ) {
      throw new Error(`Invalid casting item at row ${index + 1}.`);
    }

    return {
      id: item.id || crypto.randomUUID(),
      inputRawMaterialId: item.inputRawMaterialId,
      outputCastingId: item.outputCastingId,
      inputTitle: (item.inputTitle || "Input Material").trim(),
      outputTitle: (item.outputTitle || "Casting").trim(),
      inputUnit: trimOrNull(item.inputUnit),
      outputUnit: trimOrNull(item.outputUnit),
      issuedQty,
      issuedWeightKg,
      expectedOutputQty:
        item.expectedOutputQty == null ? null : Math.max(0, toInt(item.expectedOutputQty, 0)),
      expectedOutputWeightKg:
        item.expectedOutputWeightKg == null
          ? null
          : Math.max(0, toDecimal3(item.expectedOutputWeightKg, 0)),
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    };
  });

  const inputIds = Array.from(
    new Set(preparedItems.map((item) => item.inputRawMaterialId)),
  );
  const outputIds = Array.from(
    new Set(preparedItems.map((item) => item.outputCastingId)),
  );

  const [inputMaterials, outputCastings] = await Promise.all([
    prisma.rawMaterial.findMany({ where: { id: { in: inputIds } }, select: { id: true } }),
    prisma.castingMaster.findMany({ where: { id: { in: outputIds } }, select: { id: true } }),
  ]);

  if (inputMaterials.length !== inputIds.length) {
    return {
      ok: false as const,
      message: "One or more input raw materials do not exist.",
    };
  }

  if (outputCastings.length !== outputIds.length) {
    return {
      ok: false as const,
      message: "One or more output casting masters do not exist.",
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

  const requestedQtyByRawMaterialId = new Map<string, number>();
  for (const item of preparedItems) {
    const current = requestedQtyByRawMaterialId.get(item.inputRawMaterialId) ?? 0;
    requestedQtyByRawMaterialId.set(item.inputRawMaterialId, current + item.issuedQty);
  }

  for (const [rawMaterialId, requestedQty] of requestedQtyByRawMaterialId) {
    const availableQty = onHandByRawMaterialId.get(rawMaterialId) ?? 0;
    if (requestedQty > availableQty) {
      return {
        ok: false as const,
        message: `Issued qty cannot exceed available stock (requested ${requestedQty}, available ${availableQty}).`,
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
            outputCastingId: item.outputCastingId,
            inputTitle: item.inputTitle,
            outputTitle: item.outputTitle,
            inputUnit: item.inputUnit,
            outputUnit: item.outputUnit,
            issuedQty: item.issuedQty,
            issuedWeightKg: item.issuedWeightKg,
            expectedOutputQty: item.expectedOutputQty,
            expectedOutputWeightKg: item.expectedOutputWeightKg,
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
          qty: item.issuedQty,
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

