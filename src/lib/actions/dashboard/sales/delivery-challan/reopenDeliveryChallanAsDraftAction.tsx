"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export const reopenDeliveryChallanAsDraftAction = async (id: string) => {
  const session = await requireAuth();

  const challan = await prisma.deliveryChallan.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!challan) {
    return { ok: false as const, message: "Delivery challan not found" };
  }

  if (challan.status === "CLOSED") {
    return {
      ok: false as const,
      message: "Closed challan cannot be reopened as draft",
    };
  }

  await prisma.deliveryChallan.update({
    where: { id },
    data: {
      status: "DRAFT",
      updatedBy: {
        connect: {
          id: session.user.id,
        },
      },
    },
  });

  revalidatePath(`/dashboard/sales/delivery-challans/${id}`);
  revalidatePath(`/dashboard/sales/delivery-challans/${id}/edit`);
  revalidatePath(`/dashboard/sales/delivery-challans`);

  return { ok: true as const };
};
