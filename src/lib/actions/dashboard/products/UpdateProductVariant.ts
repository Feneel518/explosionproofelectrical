"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  ProductVariantSchema,
  ProductVariantSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductVariantValidator";
import { revalidatePath } from "next/cache";

export const updateProductVariantAction = async (
  values: ProductVariantSchemaRequest,
) => {
  await requireAuth();

  const parsed = ProductVariantSchema.safeParse(values);
  if (!parsed.success) return fail("Enter the fields properly.");

  const data = parsed.data;

  try {
    // Ensure variant exists (optionally also verify productId matches)
    const existing = await prisma.productVariant.findUnique({
      where: { id: data.id },
      select: { id: true, productId: true },
    });

    if (!existing) return fail("Product Variant not found");

    if (existing.productId !== data.productId) return fail("Invalid productId");

    const imagesKeepIds =
      data.images?.filter((x) => x.id).map((x) => x.id!) ?? [];
    const drawingsKeepIds =
      data.drawings?.filter((x) => x.id).map((x) => x.id!) ?? [];

    const componentJoinKeepIds =
      data.component?.filter((x) => x.id).map((x) => x.id!) ?? [];

    await prisma.$transaction(async (tx) => {
      // 1) Update scalar fields
      await tx.productVariant.update({
        where: { id: data.id },
        data: {
          productId: data.productId,
          variant: data.variant,
          sku: data.sku,
          typeNumber: data.typeNumber,

          rating: data.rating,
          terminals: data.terminals,
          gasket: data.gasket,
          mounting: data.mounting,
          cableEntry: data.cableEntry,
          earthing: data.earthing,

          cutoutSize: data.cutoutSize,
          plateSize: data.plateSize,
          size: data.size,
          glass: data.glass,
          wireGuard: data.wireGuard,

          rpm: data.rpm,
          kW: data.kW,
          horsePower: data.horsePower,

          status: data.status,
        },
      });

      // 2) Sync Images (ProductMedia where imageVariantId = variantId)
      // If client sends images array, we treat it as source of truth.
      if (data.images) {
        await tx.productMedia.deleteMany({
          where: {
            imageVariantId: data.id,
            ...(imagesKeepIds.length ? { id: { notIn: imagesKeepIds } } : {}),
          },
        });

        for (const img of data.images) {
          if (img.id) {
            await tx.productMedia.update({
              where: { id: img.id },
              data: {
                url: img.url,
                title: img.title ?? null,

                // enforce
                kind: "IMAGE",
                imageVariantId: data.id,
                drawingVariantId: null,
              },
            });
          } else {
            await tx.productMedia.create({
              data: {
                imageVariantId: data.id,
                kind: "IMAGE",
                url: img.url,
                title: img.title ?? null,
              },
            });
          }
        }
      }

      // 3) Sync Drawings
      if (data.drawings) {
        await tx.productMedia.deleteMany({
          where: {
            drawingVariantId: data.id,
            ...(drawingsKeepIds.length
              ? { id: { notIn: drawingsKeepIds } }
              : {}),
          },
        });

        for (const d of data.drawings) {
          if (d.id) {
            await tx.productMedia.update({
              where: { id: d.id },
              data: {
                url: d.url,
                title: d.title ?? null,

                // enforce
                kind: "DRAWING",
                drawingVariantId: data.id,
                imageVariantId: null,
              },
            });
          } else {
            await tx.productMedia.create({
              data: {
                drawingVariantId: data.id,
                kind: "DRAWING",
                url: d.url,
                title: d.title ?? null,
              },
            });
          }
        }
      }

      // 4) Sync Components (join rows)
      // Strategy:
      // - delete join rows removed (scoped to this variant only)
      // - update join rows with component updates (if you allow editing)
      // - create new components + join rows for new entries
      if (data.component) {
        await tx.productComponentsOnVariants.deleteMany({
          where: {
            variantId: data.id,
            ...(componentJoinKeepIds.length
              ? { id: { notIn: componentJoinKeepIds } }
              : {}),
          },
        });

        for (const row of data.component) {
          if (row.id) {
            // Update existing join row's linked component details
            // WARNING: this edits ProductComponent (shared). If components are shared,
            // you may NOT want to update here. If they are variant-specific, it's fine.
            await tx.productComponentsOnVariants.update({
              where: { id: row.id },
              data: {
                component: {
                  update: {
                    item: row.item,
                    unit: row.unit ?? null,
                  },
                },
              },
            });
          } else {
            // Create a new component and attach to this variant
            const comp = await tx.productComponent.create({
              data: {
                item: row.item ?? "",
                unit: row.unit ?? null,
              },
              select: { id: true },
            });

            await tx.productComponentsOnVariants.create({
              data: {
                variantId: data.id!,
                componentId: comp.id,
              },
            });
          }
        }
      }
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${data.productId}`);

    return { ok: true, message: "Product Variant Updated" };
  } catch (error) {
    console.error(error);
    return fail("Failed to update product variant");
  }
};
