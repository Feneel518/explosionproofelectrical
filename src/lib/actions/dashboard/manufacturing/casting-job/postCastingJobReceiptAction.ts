"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";

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

export async function postCastingJobReceiptAction({
  castingJobId,
  receivedAt,
  receivedByName,
  remarks,
  items,
}: {
  castingJobId: string;
  receivedAt?: string | null;
  receivedByName?: string | null;
  remarks?: string | null;
  items: Array<{
    castingJobItemId: string;
    receivedQty: number;
    receivedWeightKg: number;
  }>;
}) {
  const session = await requireAuth();

  const job = await prisma.castingJob.findUnique({
    where: { id: castingJobId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          outputCastingId: true,
          outputTitle: true,
          issuedQty: true,
          issuedWeightKg: true,
          receivedQty: true,
          receivedWeightKg: true,
        },
      },
    },
  });

  if (!job) {
    return { ok: false as const, message: "Casting job not found." };
  }

  if (job.status !== "IN_PROGRESS" && job.status !== "PARTIAL_RECEIVED") {
    return {
      ok: false as const,
      message: "Receipts can only be posted for in-progress casting jobs.",
    };
  }

  const cleanItems = (items ?? [])
    .map((item) => ({
      castingJobItemId: item.castingJobItemId,
      receivedQty: Math.max(0, toInt(item.receivedQty, 0)),
      receivedWeightKg: Math.max(0, toDecimal3(item.receivedWeightKg, 0)),
    }))
    .filter((item) => item.receivedQty > 0 || item.receivedWeightKg > 0);

  if (!cleanItems.length) {
    return { ok: false as const, message: "Enter at least one receipt row." };
  }

  const jobItemsById = new Map(job.items.map((item) => [item.id, item]));

  for (const entry of cleanItems) {
    const jobItem = jobItemsById.get(entry.castingJobItemId);
    if (!jobItem) {
      return { ok: false as const, message: "Invalid casting receipt item." };
    }

    const nextQty = Number(jobItem.receivedQty || 0) + entry.receivedQty;
    const nextWeight = Number(jobItem.receivedWeightKg || 0) + entry.receivedWeightKg;

    if (nextWeight > Number(jobItem.issuedWeightKg || 0)) {
      return {
        ok: false as const,
        message: `Received weight cannot exceed issued weight for ${jobItem.outputTitle}.`,
      };
    }
  }

  const receiptDate = toDateOrNull(receivedAt) ?? new Date();
  const referenceNo = formatFinancialDocumentNumber(job.jobFy, job.jobNo);

  try {
    await prisma.$transaction(async (tx) => {
      const latestReceipt = await tx.castingJobReceipt.findFirst({
        where: { castingJobId: job.id },
        orderBy: { receiptNo: "desc" },
        select: { receiptNo: true },
      });

      const nextReceiptNo = (latestReceipt?.receiptNo ?? 0) + 1;

      const createdReceipt = await tx.castingJobReceipt.create({
        data: {
          castingJobId: job.id,
          receiptNo: nextReceiptNo,
          receivedAt: receiptDate,
          receivedByNameSnapshot: trimOrNull(receivedByName),
          remarks: trimOrNull(remarks),
        },
        select: { id: true },
      });

      for (let index = 0; index < cleanItems.length; index += 1) {
        const entry = cleanItems[index];
        const jobItem = jobItemsById.get(entry.castingJobItemId)!;

        const nextQty = Number(jobItem.receivedQty || 0) + entry.receivedQty;
        const nextWeight = Number(
          (Number(jobItem.receivedWeightKg || 0) + entry.receivedWeightKg).toFixed(3),
        );
        const pendingWeight = Number(
          Math.max(Number(jobItem.issuedWeightKg || 0) - nextWeight, 0).toFixed(3),
        );

        await tx.castingJobReceiptItem.create({
          data: {
            castingJobReceiptId: createdReceipt.id,
            castingJobItemId: jobItem.id,
            receivedQty: entry.receivedQty,
            receivedWeightKg: entry.receivedWeightKg,
            sortOrder: index,
          },
        });

        await tx.castingJobItem.update({
          where: { id: jobItem.id },
          data: {
            receivedQty: nextQty,
            receivedWeightKg: nextWeight,
            pendingWeightKg: pendingWeight,
          },
        });

        if (entry.receivedQty > 0) {
          await postStockMovement(tx, {
            castingMasterId: jobItem.outputCastingId,
            movementType: "IN",
            referenceType: "CASTING_JOB",
            referenceId: job.id,
            referenceNo,
            qty: entry.receivedQty,
            movementDate: receiptDate,
            actorName: job.workerNameSnapshot,
            remarks: `Casting receipt (${jobItem.outputTitle})`,
            createdById: session.user.id,
          });
        }
      }

      const updatedItems = await tx.castingJobItem.findMany({
        where: { castingJobId: job.id },
        select: {
          issuedQty: true,
          issuedWeightKg: true,
          receivedQty: true,
          receivedWeightKg: true,
          pendingWeightKg: true,
        },
      });

      const totalIssuedQty = updatedItems.reduce(
        (sum, item) => sum + Number(item.issuedQty || 0),
        0,
      );
      const totalIssuedWeightKg = Number(
        updatedItems
          .reduce((sum, item) => sum + Number(item.issuedWeightKg || 0), 0)
          .toFixed(3),
      );
      const totalReceivedQty = updatedItems.reduce(
        (sum, item) => sum + Number(item.receivedQty || 0),
        0,
      );
      const totalReceivedWeightKg = Number(
        updatedItems
          .reduce((sum, item) => sum + Number(item.receivedWeightKg || 0), 0)
          .toFixed(3),
      );
      const totalPendingWeightKg = Number(
        updatedItems
          .reduce((sum, item) => sum + Number(item.pendingWeightKg || 0), 0)
          .toFixed(3),
      );
      const yieldPercent =
        totalIssuedWeightKg > 0
          ? Number(((totalReceivedWeightKg / totalIssuedWeightKg) * 100).toFixed(3))
          : null;

      const isClosed = totalPendingWeightKg <= 0;

      await tx.castingJob.update({
        where: { id: job.id },
        data: {
          status: isClosed ? "CLOSED" : "PARTIAL_RECEIVED",
          closedAt: isClosed ? new Date() : null,
          closedById: isClosed ? session.user.id : null,
          updatedById: session.user.id,
          totalIssuedQty,
          totalIssuedWeightKg,
          totalReceivedQty,
          totalReceivedWeightKg,
          totalPendingWeightKg,
          yieldPercent,
        },
      });
    });
  } catch (error: any) {
    return {
      ok: false as const,
      message: error?.message || "Failed to post casting receipt.",
    };
  }

  revalidatePath("/dashboard/manufacturing/casting-jobs");
  revalidatePath(`/dashboard/manufacturing/casting-jobs/${castingJobId}`);
  revalidatePath("/dashboard/inventory/stock");
  revalidatePath("/dashboard/inventory/movements");

  return {
    ok: true as const,
    message: "Casting receipt posted successfully.",
  };
}
