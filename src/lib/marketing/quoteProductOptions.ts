import { prisma } from "@/lib/prisma/db";
import { catalogProductName } from "@/lib/products/catalogNames";

export const fallbackQuoteProductOptions = [
  "Flameproof Lighting",
  "Control Panels",
  "LED Floodlights",
  "Junction Boxes",
  "Instrumentation",
  "Custom Build / Other",
];

export async function getQuoteProductOptions() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      name: true,
      displayName: true,
    },
  });

  const names = Array.from(
    new Set(
      products
        .map((product) => catalogProductName(product).trim())
        .filter((name) => name.length > 0),
    ),
  );

  return names.length > 0 ? names : fallbackQuoteProductOptions;
}
