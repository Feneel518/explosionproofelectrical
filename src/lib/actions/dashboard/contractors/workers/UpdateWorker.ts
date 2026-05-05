"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail, isUniqueConstraintError } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  WorkerSchema,
  WorkerSchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkerValidator";
import { revalidatePath } from "next/cache";

export const updateWorkerAction = async (values: WorkerSchemaRequest) => {
  const session = await requireAuth();

  const parsed = WorkerSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "Enter the fields properly." };
  }
  const data = parsed.data;

  if (!data.id) {
    return fail("Worker id is required for update.");
  }

  try {
    const updated = await prisma.worker.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        role: data.role ?? "TURNER",
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        joinedAt: data.joinedAt ?? null,
        notes: data.notes || null,
        status: data.status ?? "ACTIVE",
        updatedById: session.user.id,
      },
      select: { id: true, code: true, name: true },
    });

    revalidatePath("/dashboard/contractors/workers");
    revalidatePath(`/dashboard/contractors/workers/${data.id}`);
    return {
      ok: true,
      message: "Worker updated successfully.",
      data: updated,
    };
  } catch (error: any) {
    if (isUniqueConstraintError(error, "code")) {
      return fail(`Worker code "${data.code}" is already in use.`);
    }
    return fail(error?.message ?? "Failed to update worker.");
  }
};
