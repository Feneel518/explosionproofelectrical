"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const getQuotationDraftAction = async (id: string) => {
  await requireAuth();

  const q = await prisma.quotation.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      draftData: true,
      draftVersion: true,
      quoteFy: true,
      quoteNo: true,
    },
  });

  if (!q) return { ok: false as const, message: "Not found" };
  if (q.status !== "DRAFT")
    return { ok: false as const, message: "Not a draft" };

  const draft = q.draftData ?? { header: {}, items: [] };

  return {
    ok: true as const,
    quotationId: q.id,
    draft,
    draftVersion: q.draftVersion,
    quoteFY: q.quoteFy,
    quoteNo: q.quoteNo,
  };
};
