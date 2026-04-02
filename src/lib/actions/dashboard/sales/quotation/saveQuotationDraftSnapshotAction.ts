"use server";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { QuotationDraftData } from "@/lib/types/QuotationType";

export const saveQuotationDraftSnapshotAction = async ({
  clientVersion,
  draft,
  quotationId,
}: {
  quotationId: string;
  draft: QuotationDraftData;
  clientVersion: number;
}) => {
  const session = await requireAuth();

  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!q) return { ok: false as const, message: "Quotation not found" };
  if (q.status !== "DRAFT")
    return { ok: false as const, message: "Cannot autosave non-draft" };

  // ✅ prevents multi-tab overwrites
  if (clientVersion !== q.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: q.draftVersion,
    };
  }

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
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
};
