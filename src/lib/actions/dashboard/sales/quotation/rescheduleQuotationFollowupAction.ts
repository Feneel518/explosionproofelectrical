"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function rescheduleQuotationFollowupAction(input: {
  followupId: string;
  scheduledAt: Date;
  note?: string | null;
}) {
  const session = await requireAuth();

  const followup = await prisma.quotationFollowup.findUnique({
    where: { id: input.followupId },
    select: {
      id: true,
      quotationId: true,
      doneAt: true,
      quotation: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!followup) {
    return { ok: false as const, message: "Follow-up not found" };
  }

  if (followup.doneAt) {
    return {
      ok: false as const,
      message: "Completed follow-up cannot be rescheduled",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quotationFollowup.update({
        where: { id: input.followupId },
        data: {
          scheduledAt: input.scheduledAt,
          note: input.note ?? undefined,
        },
      });

      const earliestPending = await tx.quotationFollowup.findFirst({
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
          nextFollowupAt: earliestPending?.scheduledAt ?? null,
          ...(["SENT", "EXPIRED"].includes(followup.quotation.status)
            ? { status: "FOLLOWUP" as const }
            : {}),
          updatedById: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/sales/quotations");
    revalidatePath(`/dashboard/sales/quotations/${followup.quotationId}`);

    return { ok: true as const, message: "Follow-up rescheduled" };
  } catch (error) {
    console.error("rescheduleQuotationFollowupAction error:", error);
    return {
      ok: false as const,
      message: "Failed to reschedule follow-up",
    };
  }
}
