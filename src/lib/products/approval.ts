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
