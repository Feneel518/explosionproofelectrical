"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/check/requireAuth";
import {
  formatProductSerial,
  normalizeSerialPrefix,
} from "@/lib/helpers/serials/productSerial";
import { prisma } from "@/lib/prisma/db";

type GenerateProductSerialsInput = {
  productId: string;
  prefix: string;
  quantity: number;
  year: number;
};

export async function generateProductSerialsAction(
  input: GenerateProductSerialsInput,
) {
  await requireAuth();

  const productId = input.productId?.trim();
  const prefix = normalizeSerialPrefix(input.prefix ?? "");
  const quantity = Math.trunc(Number(input.quantity));
  const year = Math.trunc(Number(input.year));

  if (!productId) return { ok: false as const, message: "Select a product" };
  if (!/^[A-Z0-9]{2,10}$/.test(prefix)) {
    return {
      ok: false as const,
      message: "Product code must contain 2 to 10 letters or numbers",
    };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
    return {
      ok: false as const,
      message: "Quantity must be between 1 and 1,000",
    };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2099) {
    return { ok: false as const, message: "Enter a valid manufacturing year" };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            name: true,
            serialPrefix: true,
            serialTrackingEnabled: true,
            _count: { select: { serials: true } },
          },
        });

        if (!product) throw new Error("Product not found");
        if (
          product._count.serials > 0 &&
          product.serialPrefix &&
          product.serialPrefix !== prefix
        ) {
          throw new Error(
            `This product already uses the code ${product.serialPrefix}`,
          );
        }

        const prefixOwner = await tx.product.findFirst({
          where: { serialPrefix: prefix, NOT: { id: productId } },
          select: { name: true },
        });
        if (prefixOwner) {
          throw new Error(`Code ${prefix} is already used by ${prefixOwner.name}`);
        }

        await tx.product.update({
          where: { id: productId },
          data: { serialPrefix: prefix, serialTrackingEnabled: true },
        });

        const counter = await tx.productSerialCounter.upsert({
          where: { productId_year: { productId, year } },
          create: { productId, year, lastNumber: quantity },
          update: { lastNumber: { increment: quantity } },
          select: { lastNumber: true },
        });

        const startNumber = counter.lastNumber - quantity + 1;
        const batchId = crypto.randomUUID();
        const rows = Array.from({ length: quantity }, (_, index) => {
          const sequence = startNumber + index;
          return {
            productId,
            year,
            sequence,
            serialNumber: formatProductSerial(prefix, year, sequence),
            batchId,
          };
        });

        await tx.productSerial.createMany({ data: rows });

        return {
          batchId,
          productName: product.name,
          startNumber,
          endNumber: counter.lastNumber,
          firstSerial: rows[0]!.serialNumber,
          lastSerial: rows.at(-1)!.serialNumber,
          quantity,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );

    revalidatePath("/dashboard/serial");
    return { ok: true as const, ...result };
  } catch (error) {
    console.error("generateProductSerialsAction", error);
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Failed to generate serials",
    };
  }
}
