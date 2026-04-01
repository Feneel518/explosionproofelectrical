"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { FollowupOutcome } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function completeQuotationFollowupAction(input: {
  followupId: string;
  outcome?: FollowupOutcome | null;
  note?: string | null;
}) {
  await requireAuth();

  const followup = await prisma.quotationFollowup.findUnique({
    where: { id: input.followupId },
    select: {
      id: true,
      quotationId: true,
    },
  });

  if (!followup) {
    return { ok: false as const, message: "Follow-up not found" };
  }

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quotationFollowup.update({
        where: { id: input.followupId },
        data: {
          doneAt: now,
          outcome: input.outcome ?? null,
          note: input.note ?? undefined,
        },
      });

      const nextPending = await tx.quotationFollowup.findFirst({
        where: {
          quotationId: followup.quotationId,
          doneAt: null,
        },
        orderBy: {
          scheduledAt: "asc",
        },
        select: {
          scheduledAt: true,
        },
      });

      await tx.quotation.update({
        where: { id: followup.quotationId },
        data: {
          lastFollowupAt: now,
          nextFollowupAt: nextPending?.scheduledAt ?? null,
        },
      });
    });

    revalidatePath("/dashboard/sales/quotations");
    revalidatePath(`/dashboard/sales/quotations/${followup.quotationId}`);

    return { ok: true as const, message: "Follow-up completed" };
  } catch (error) {
    console.error("completeQuotationFollowupAction error:", error);
    return {
      ok: false as const,
      message: "Failed to complete follow-up",
    };
  }
}
