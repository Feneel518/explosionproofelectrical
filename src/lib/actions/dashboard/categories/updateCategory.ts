"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import {
  CategorySchema,
  CategorySchemaRequest,
} from "@/lib/validators/dashboard/categories/CategoryValidator";
import {
  CustomerSchema,
  CustomerSchemaRequest,
} from "@/lib/validators/dashboard/customers/CustomerValidator";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const updateCategoryAction = async (values: CategorySchemaRequest) => {
  const session = await requireAuth();

  const parsed = CategorySchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  if (!data.id) {
    return {
      ok: false,
      message: "No Category Id received to update the customer.",
    };
  }

  try {
    const existing = await prisma.category.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!existing) {
      return {
        ok: false,
        message:
          "No Category found in the database, please proceed to create a new one.",
      };
    }

    const response = await prisma.category.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        createdById: session.user.id,
        status: (data.status as any) ?? "ACTIVE",
      },
    });

    revalidatePath("/dashboard/categories");
    revalidatePath(`/dashboard/categories/${response.id}`);
    return {
      ok: true,
      message: "Category updated successfully.",
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create category.");
  }
};
