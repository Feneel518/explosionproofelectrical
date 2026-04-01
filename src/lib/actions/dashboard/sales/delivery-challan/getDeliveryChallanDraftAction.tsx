"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const getDeliveryChallanDraftAction = async (id: string) => {
  await requireAuth();

  const challan = await prisma.deliveryChallan.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      draftData: true,
      draftVersion: true,
      challanFy: true,
      challanNo: true,
      challanCode: true,
    },
  });

  if (!challan) return { ok: false as const, message: "Not found" };
  if (challan.status !== "DRAFT") {
    return { ok: false as const, message: "Not a draft" };
  }

  const draft = challan.draftData ?? {
    header: {},
    items: [],
  };

  return {
    ok: true as const,
    deliveryChallanId: challan.id,
    draft,
    draftVersion: challan.draftVersion,
    challanFY: challan.challanFy,
    challanNo: challan.challanNo,
    challanCode: challan.challanCode,
  };
};
