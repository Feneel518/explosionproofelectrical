"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { MaterialIssueDraftData } from "./createDraftMaterialIssueAction";

export async function saveMaterialIssueDraftSnapshotAction({
  materialIssueId,
  draft,
  clientVersion,
}: {
  materialIssueId: string;
  draft: MaterialIssueDraftData;
  clientVersion: number;
}) {
  const session = await requireAuth();

  const issue = await prisma.materialIssue.findUnique({
    where: { id: materialIssueId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!issue) {
    return { ok: false as const, message: "Material issue not found." };
  }

  if (issue.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Only draft material issue can be saved.",
    };
  }

  if (clientVersion !== issue.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: issue.draftVersion,
    };
  }

  const updated = await prisma.materialIssue.update({
    where: { id: materialIssueId },
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
