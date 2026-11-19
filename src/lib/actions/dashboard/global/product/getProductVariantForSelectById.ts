"use server";

import { prisma } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/check/permissions";
import { ProductVariantSearchItem } from "@/lib/types/ProductVariantSeachItem";
import { catalogItemTitle, catalogProductName, catalogVariantName } from "@/lib/products/catalogNames";

export async function getProductVariantForSelectById(
  id: string,
): Promise<ProductVariantSearchItem | null> {
  await requirePermission("master.read");

  const v = await prisma.productVariant.findUnique({
    where: { id },
    select: {
      id: true,
      productId: true,
      variant: true,
      displayName: true,
      sku: true,
      typeNumber: true,

      rating: true,
      terminals: true,

      gasket: true,
      mounting: true,
      cableEntry: true,
      earthing: true,

      cutoutSize: true,
      plateSize: true,
      glass: true,
      wireGuard: true,

      size: true,
      rpm: true,
      kW: true,
      horsePower: true,
      product: {
        select: {
          name: true,
          displayName: true,
          hardware: true,
          hsnCode: true,
          shortDesc: true,
        },
      },
      components: {
        select: {
          component: {
            select: {
              id: true,
              item: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  if (!v) return null;

  return {
    id: v.id,
    productId: v.productId,
    description: v.product.shortDesc ?? null,
    hardware: v.product.hardware ?? null,
    hsnCode: v.product.hsnCode ?? null,
    productName: catalogProductName(v.product),
    variantName: catalogVariantName(v),
    title: catalogItemTitle(v.product, v),
    sku: v.sku ?? null,
    typeNumber: v.typeNumber ?? null,

    rating: v.rating ?? null,
    terminals: v.terminals ?? null,

    gasket: v.gasket ?? null,
    mounting: v.mounting ?? null,
    cableEntry: v.cableEntry ?? null,
    earthing: v.earthing ?? null,

    cutoutSize: v.cutoutSize ?? null,
    plateSize: v.plateSize ?? null,
    glass: v.glass ?? null,
    wireGuard: v.wireGuard ?? null,

    size: v.size ?? null,
    rpm: v.rpm ?? null,
    kW: v.kW ?? null,
    horsePower: v.horsePower ?? null,
    component: v.components.map((comp) => {
      return {
        id: comp.component.id,
        item: comp.component.item,
        unit: comp.component.unit,
      };
    }),
  };
}
