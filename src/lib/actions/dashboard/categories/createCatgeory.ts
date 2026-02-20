"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  CategorySchema,
  CategorySchemaRequest,
} from "@/lib/validators/dashboard/categories/CategoryValidator";
import { revalidatePath } from "next/cache";

export const createCategoryAction = async (values: CategorySchemaRequest) => {
  const session = await requireAuth();

  const parsed = CategorySchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  try {
    const response = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        createdById: session.user.id,
        status: (data.status as any) ?? "ACTIVE",
      },
    });

    revalidatePath("/dashboard/categories");
    return {
      ok: true,
      message: "Category created successfully.",
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create category.");
  }
};
