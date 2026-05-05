"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export const softDeleteWorkerAction = async (workerId: string) => {
  const session = await requireAuth();

  if (!workerId) {
    return { ok: false, message: "No worker id provided." };
  }

  try {
    const exists = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true },
    });
    if (!exists) {
      return { ok: false, message: "Worker not found." };
    }

    await prisma.worker.update({
      where: { id: workerId },
      data: { deletedAt: new Date(), deletedById: session.user.id, status: "INACTIVE" },
    });

    revalidatePath("/dashboard/contractors/workers");
    return { ok: true, message: "Worker archived." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to archive worker.");
  }
};

export const restoreWorkerAction = async (workerId: string) => {
  await requireAuth();

  if (!workerId) {
    return { ok: false, message: "No worker id provided." };
  }

  try {
    await prisma.worker.update({
      where: { id: workerId },
      data: { deletedAt: null, deletedById: null, status: "ACTIVE" },
    });
    revalidatePath("/dashboard/contractors/workers");
    return { ok: true, message: "Worker restored." };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to restore worker.");
  }
};
