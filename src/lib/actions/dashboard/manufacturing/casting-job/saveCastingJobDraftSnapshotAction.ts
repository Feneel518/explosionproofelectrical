"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { CastingJobDraftData } from "./createDraftCastingJobAction";

export async function saveCastingJobDraftSnapshotAction({
  castingJobId,
  draft,
  clientVersion,
}: {
  castingJobId: string;
  draft: CastingJobDraftData;
  clientVersion: number;
}) {
  const session = await requireAuth();

  const job = await prisma.castingJob.findUnique({
    where: { id: castingJobId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!job) {
    return { ok: false as const, message: "Casting job not found." };
  }

  if (job.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Only draft casting job can be saved.",
    };
  }

  if (clientVersion !== job.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: job.draftVersion,
    };
  }

  const updated = await prisma.castingJob.update({
    where: { id: castingJobId },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  });

  return {
    ok: true as const,
    serverVersion: updated.draftVersion,
    savedAt: updated.updatedAt.toISOString(),
  };
}
