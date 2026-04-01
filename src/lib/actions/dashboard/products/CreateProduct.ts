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

export const createProductAction = async (values: ProductSchemaRequest) => {
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
    const created = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,

        flpType: data.flpType ?? null,
        protection: data.protection ?? null,
        gasGroup: data.gasGroup ?? null,
        material: data.material ?? null,
        finish: data.finish ?? null,
        hardware: data.hardware ?? null,
        hsnCode: data.hsnCode ?? null,
        zones: data.zones,

        shortDesc: data.shortDesc ?? null,
        longDesc: data.longDesc ?? null,

        categoryId: data.categoryId,
        status: data.status ?? "ACTIVE",
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/products");

    return { ok: true, message: "Product created" };
  } catch (e) {
    if (isUniqueConstraintError(e, "slug")) {
      return fail("Slug already exists");
    }
    return fail("Failed to create product");
  }
};
