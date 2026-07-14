import { prisma } from "@/lib/prisma/db";

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
    },
  });

  const names = Array.from(
    new Set(
      products
        .map((product) => product.name.trim())
        .filter((name) => name.length > 0),
    ),
  );

  return names.length > 0 ? names : fallbackQuoteProductOptions;
}
