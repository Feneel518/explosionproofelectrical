"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function deleteQuotationFollowupAction(input: {
  followupId: string;
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
      message: "Completed follow-up cannot be deleted",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quotationFollowup.delete({
        where: { id: input.followupId },
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
          ...(earliestPending &&
          ["SENT", "EXPIRED"].includes(followup.quotation.status)
            ? { status: "FOLLOWUP" as const }
            : !earliestPending && followup.quotation.status === "FOLLOWUP"
              ? { status: "SENT" as const }
              : {}),
          updatedById: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/sales/quotations");
    revalidatePath(`/dashboard/sales/quotations/${followup.quotationId}`);

    return { ok: true as const, message: "Follow-up deleted" };
  } catch (error) {
    console.error("deleteQuotationFollowupAction error:", error);
    return {
      ok: false as const,
      message: "Failed to delete follow-up",
    };
  }
}
