"use server";
import { saveVersionedDraft } from "@/lib/prisma/saveVersionedDraft";

import { requirePermission } from "@/lib/check/permissions";
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
  const session = await requirePermission("production.write");

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


  return saveVersionedDraft(
    () => prisma.castingJob.update({
    where: { id: castingJobId, status: "DRAFT", draftVersion: clientVersion },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  }),
    () => prisma.castingJob.findUnique({ where: { id: castingJobId }, select: { draftVersion: true } }),
  );
}
