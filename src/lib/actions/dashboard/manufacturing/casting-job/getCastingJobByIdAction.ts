"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";

export async function getCastingJobByIdAction(id: string) {
  await requireAuth();

  const castingJob = await prisma.castingJob.findUnique({
    where: { id },
    include: {
      supplier: {
        select: {
          id: true,
          companyName: true,
        },
      },
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          inputRawMaterial: {
            select: {
              id: true,
              companyItemName: true,
              itemCode: true,
              unit: true,
            },
          },
          outputCasting: {
            select: {
              id: true,
              castingItemName: true,
              castingCode: true,
              unit: true,
            },
          },
          receiptItems: {
            orderBy: { createdAt: "desc" },
            include: {
              castingJobReceipt: {
                select: {
                  id: true,
                  receiptNo: true,
                  receivedAt: true,
                },
              },
            },
          },
        },
      },
      receipts: {
        orderBy: [{ receivedAt: "desc" }, { receiptNo: "desc" }],
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              castingJobItem: {
                select: {
                  id: true,
                  outputTitle: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!castingJob) {
    return { ok: false as const, message: "Casting job not found." };
  }

  return { ok: true as const, castingJob: serializeForClient(castingJob) };
}
