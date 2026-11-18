"use server";
import { saveVersionedDraft } from "@/lib/prisma/saveVersionedDraft";

import { requirePermission } from "@/lib/check/permissions";
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
  const session = await requirePermission("inventory.write");

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


  return saveVersionedDraft(
    () => prisma.materialIssue.update({
    where: { id: materialIssueId, status: "DRAFT", draftVersion: clientVersion },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
    select: { draftVersion: true, updatedAt: true },
  }),
    () => prisma.materialIssue.findUnique({ where: { id: materialIssueId }, select: { draftVersion: true } }),
  );
}
