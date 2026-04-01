"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function scheduleQuotationFollowupAction(input: {
  quotationId: string;
  scheduledAt: Date;
  note?: string | null;
}) {
  const session = await requireAuth();

  const quotation = await prisma.quotation.findUnique({
    where: { id: input.quotationId },
    select: { id: true },
  });

  if (!quotation) {
    return { ok: false as const, message: "Quotation not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quotationFollowup.create({
        data: {
          quotationId: input.quotationId,
          scheduledAt: input.scheduledAt,
          note: input.note ?? null,
          createdById: session.user.id,
        },
      });

      const earliestPending = await tx.quotationFollowup.findFirst({
        where: {
          quotationId: input.quotationId,
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
        where: { id: input.quotationId },
        data: {
          nextFollowupAt: earliestPending?.scheduledAt ?? input.scheduledAt,
          updatedById: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/sales/quotations");
    revalidatePath(`/dashboard/sales/quotations/${input.quotationId}`);

    return { ok: true as const, message: "Follow-up scheduled" };
  } catch (error) {
    console.error("scheduleQuotationFollowupAction error:", error);
    return {
      ok: false as const,
      message: "Failed to schedule follow-up",
    };
  }
}
