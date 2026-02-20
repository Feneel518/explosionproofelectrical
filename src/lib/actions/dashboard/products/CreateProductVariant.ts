"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import {
  fail,
  isUniqueConstraintError,
} from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  ProductVariantSchema,
  ProductVariantSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductVariantValidator";
import { revalidatePath } from "next/cache";

export const createProductVariantAction = async (
  values: ProductVariantSchemaRequest,
) => {
  const session = await requireAuth();

  const parsed = ProductVariantSchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  try {
    const response = await prisma.productVariant.create({
      data: {
        productId: data.productId,
        variant: data.variant,
        cableEntry: data.cableEntry,
        cutoutSize: data.cutoutSize,
        earthing: data.earthing,
        gasket: data.gasket,
        glass: data.glass,
        horsePower: data.horsePower,
        kW: data.kW,
        mounting: data.mounting,
        rating: data.rating,
        rpm: data.rpm,
        plateSize: data.plateSize,
        size: data.size,
        sku: data.sku,
        status: data.status,
        terminals: data.terminals,
        typeNumber: data.typeNumber,
        wireGuard: data.wireGuard,
        images: {
          create: data.images?.map((img) => {
            return {
              kind: img.kind,
              url: img.url,
              title: img.title,
            };
          }),
        },

        drawings: {
          create: data.drawings?.map((dwg) => {
            return {
              kind: dwg.kind,
              url: dwg.url,
              title: dwg.title,
            };
          }),
        },
        components: {
          create: data.component?.map((comp) => {
            return {
              component: {
                create: {
                  item: comp.item!,
                  unit: comp.unit,
                },
              },
            };
          }),
        },
      },
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${data.productId}`);
    return {
      ok: true,
      message: "Product Variant Created",
    };
  } catch (error) {
    return fail("Failed to create product");
  }
};
