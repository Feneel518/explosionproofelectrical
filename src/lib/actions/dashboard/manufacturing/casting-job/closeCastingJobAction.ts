"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function closeCastingJobAction(castingJobId: string) {
  const session = await requireAuth();

  const job = await prisma.castingJob.findUnique({
    where: { id: castingJobId },
    select: { id: true, status: true },
  });

  if (!job) {
    return { ok: false as const, message: "Casting job not found." };
  }

  if (job.status !== "IN_PROGRESS" && job.status !== "PARTIAL_RECEIVED") {
    return {
      ok: false as const,
      message: "Only in-progress casting jobs can be closed.",
    };
  }

  await prisma.castingJob.update({
    where: { id: castingJobId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: session.user.id,
      updatedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/manufacturing/casting-jobs");
  revalidatePath(`/dashboard/manufacturing/casting-jobs/${castingJobId}`);

  return {
    ok: true as const,
    message: "Casting job closed.",
  };
}
