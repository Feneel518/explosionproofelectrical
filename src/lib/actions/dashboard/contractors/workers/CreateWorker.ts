"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail, isUniqueConstraintError } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  WorkerSchema,
  WorkerSchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkerValidator";
import { revalidatePath } from "next/cache";

export const createWorkerAction = async (values: WorkerSchemaRequest) => {
  const session = await requireAuth();

  const parsed = WorkerSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "Enter the fields properly." };
  }
  const data = parsed.data;

  try {
    const created = await prisma.worker.create({
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
        createdById: session.user.id,
      },
      select: { id: true, code: true, name: true },
    });

    revalidatePath("/dashboard/contractors/workers");
    return {
      ok: true,
      message: "Worker created successfully.",
      data: created,
    };
  } catch (error: any) {
    if (isUniqueConstraintError(error, "code")) {
      return fail(`Worker code "${data.code}" is already in use.`);
    }
    return fail(error?.message ?? "Failed to create worker.");
  }
};
