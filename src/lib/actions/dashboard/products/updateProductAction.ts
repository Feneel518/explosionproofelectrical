"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import {
  fail,
  isUniqueConstraintError,
} from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  ProductSchema,
  ProductSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductValidator";
import { revalidatePath } from "next/cache";

export const updateProductAction = async (values: ProductSchemaRequest) => {
  const session = await requireAuth();

  const parsed = ProductSchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  try {
    // Ensure not updating a deleted record unless you want to allow that
    const existing = await prisma.product.findUnique({
      where: { id: data.id },
      select: { id: true, deletedAt: true, categoryId: true },
    });

    if (!existing) return fail("Product not found");
    if (existing.deletedAt)
      return fail("Cannot update a deleted product. Restore it first.");

    const updated = await prisma.product.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),

        ...(data.flpType !== undefined
          ? { flpType: data.flpType ?? null }
          : {}),
        ...(data.protection !== undefined
          ? { protection: data.protection ?? null }
          : {}),
        ...(data.gasGroup !== undefined
          ? { gasGroup: data.gasGroup ?? null }
          : {}),
        ...(data.material !== undefined
          ? { material: data.material ?? null }
          : {}),
        ...(data.finish !== undefined ? { finish: data.finish ?? null } : {}),
        ...(data.hardware !== undefined
          ? { hardware: data.hardware ?? null }
          : {}),
        ...(data.hsnCode !== undefined
          ? { hsnCode: data.hsnCode ?? null }
          : {}),

        ...(data.zones !== undefined ? { zones: data.zones } : {}),

        ...(data.shortDesc !== undefined
          ? { shortDesc: data.shortDesc ?? null }
          : {}),
        ...(data.longDesc !== undefined
          ? { longDesc: data.longDesc ?? null }
          : {}),

        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      select: { id: true, categoryId: true },
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${updated.id}`);

    return {
      ok: true,
      message: "Product updated successfully.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error, "slug")) {
      return fail("Slug already exists");
    }
    return fail("Failed to update product");
  }
};
