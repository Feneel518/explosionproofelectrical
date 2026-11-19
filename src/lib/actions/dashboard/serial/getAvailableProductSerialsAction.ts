"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { catalogProductName } from "@/lib/products/catalogNames";

export async function getAvailableProductSerialsAction(productId: string) {
  await requirePermission("production.read");

  if (!productId) {
    return { ok: false as const, message: "Product is required" };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      displayName: true,
      serialPrefix: true,
      serialTrackingEnabled: true,
      serials: {
        where: { status: "AVAILABLE" },
        orderBy: [{ year: "asc" }, { sequence: "asc" }],
        take: 2000,
        select: { id: true, serialNumber: true, year: true, sequence: true },
      },
    },
  });

  if (!product) return { ok: false as const, message: "Product not found" };

  return {
    ok: true as const,
    productName: catalogProductName(product),
    trackingEnabled: product.serialTrackingEnabled,
    prefix: product.serialPrefix,
    serials: product.serials,
  };
}
