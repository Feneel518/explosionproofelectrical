import { prisma } from "@/lib/prisma/db";
import type { ProductSchemaRequest } from "@/lib/validators/dashboard/products/ProductValidator";
import type { ProductVariantSchemaRequest } from "@/lib/validators/dashboard/products/ProductVariantValidator";
import type { Prisma } from "@prisma/client";
import { PRODUCT_OWNER_EMAIL } from "@/lib/check/requireProductOwner";

export const APPROVAL_SETTINGS_ID = "product-approval";

export async function getProductApprovalSettings() {
  return prisma.productApprovalSettings.upsert({
    where: { id: APPROVAL_SETTINGS_ID },
    update: { approvalEmail: PRODUCT_OWNER_EMAIL, requireProductApproval: true, requireVariantApproval: true },
    create: { id: APPROVAL_SETTINGS_ID, approvalEmail: PRODUCT_OWNER_EMAIL },
  });
}

export const toApprovalPayload = (
  data: ProductSchemaRequest | ProductVariantSchemaRequest,
) => JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;

export function productCreateData(data: ProductSchemaRequest) {
  return {
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
    status: data.status ?? ("ACTIVE" as const),
  };
}

export const productUpdateData = productCreateData;

export function variantCreateData(data: ProductVariantSchemaRequest) {
  return {
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
      create: data.images?.map((image) => ({
        kind: image.kind,
        url: image.url,
        title: image.title,
      })),
    },
    drawings: {
      create: data.drawings?.map((drawing) => ({
        kind: drawing.kind,
        url: drawing.url,
        title: drawing.title,
      })),
    },
    components: {
      create: data.component?.map((component) => ({
        component: {
          create: { item: component.item!, unit: component.unit },
        },
      })),
    },
  };
}

export async function applyVariantUpdate(
  tx: Prisma.TransactionClient,
  data: ProductVariantSchemaRequest & { id: string },
) {
  const imagesKeepIds = data.images?.flatMap((image) => image.id ? [image.id] : []) ?? [];
  const drawingsKeepIds = data.drawings?.flatMap((drawing) => drawing.id ? [drawing.id] : []) ?? [];
  const componentJoinKeepIds = data.component?.flatMap((row) => row.id ? [row.id] : []) ?? [];

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

  if (data.images) {
    await tx.productMedia.deleteMany({
      where: {
        imageVariantId: data.id,
        ...(imagesKeepIds.length ? { id: { notIn: imagesKeepIds } } : {}),
      },
    });
    for (const image of data.images) {
      if (image.id) {
        const updated = await tx.productMedia.updateMany({
          where: { id: image.id, imageVariantId: data.id },
          data: { url: image.url, title: image.title ?? null, kind: "IMAGE" },
        });
        if (updated.count !== 1) throw new Error("INVALID_MEDIA");
      } else {
        await tx.productMedia.create({
          data: {
            imageVariantId: data.id,
            kind: "IMAGE",
            url: image.url,
            title: image.title ?? null,
          },
        });
      }
    }
  }

  if (data.drawings) {
    await tx.productMedia.deleteMany({
      where: {
        drawingVariantId: data.id,
        ...(drawingsKeepIds.length ? { id: { notIn: drawingsKeepIds } } : {}),
      },
    });
    for (const drawing of data.drawings) {
      if (drawing.id) {
        const updated = await tx.productMedia.updateMany({
          where: { id: drawing.id, drawingVariantId: data.id },
          data: { url: drawing.url, title: drawing.title ?? null, kind: "DRAWING" },
        });
        if (updated.count !== 1) throw new Error("INVALID_MEDIA");
      } else {
        await tx.productMedia.create({
          data: {
            drawingVariantId: data.id,
            kind: "DRAWING",
            url: drawing.url,
            title: drawing.title ?? null,
          },
        });
      }
    }
  }

  if (data.component) {
    await tx.productComponentsOnVariants.deleteMany({
      where: {
        variantId: data.id,
        ...(componentJoinKeepIds.length ? { id: { notIn: componentJoinKeepIds } } : {}),
      },
    });
    for (const row of data.component) {
      if (row.id) {
        const join = await tx.productComponentsOnVariants.findFirst({
          where: { id: row.id, variantId: data.id },
          select: { componentId: true },
        });
        if (!join) throw new Error("INVALID_COMPONENT");
        await tx.productComponent.update({
          where: { id: join.componentId },
          data: { item: row.item ?? "", unit: row.unit ?? null },
        });
      } else {
        const component = await tx.productComponent.create({
          data: { item: row.item ?? "", unit: row.unit ?? null },
          select: { id: true },
        });
        await tx.productComponentsOnVariants.create({
          data: { variantId: data.id, componentId: component.id },
        });
      }
    }
  }

  return { id: data.id };
}
