"use server";

import { requireProductOwner } from "@/lib/check/requireProductOwner";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function softDeleteProductAction(id: string) {
  const session = await requireProductOwner();
  if (!id) return fail("Product id is required.");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });
  if (!product) return fail("Product not found.");
  if (product.deletedAt) return fail("Product is already deleted.");

  await prisma.product.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: session.user.id,
      status: "INACTIVE",
      variants: { updateMany: { where: {}, data: { status: "INACTIVE" } } },
    },
  });
  revalidatePath("/dashboard/products");
  revalidatePath("/catalog");
  return {
    ok: true as const,
    message: "Product removed from the active catalogue. Historical records were preserved.",
  };
}

export async function restoreProductAction(id: string) {
  await requireProductOwner();
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });
  if (!product) return fail("Product not found.");
  if (!product.deletedAt) return fail("Product is not deleted.");

  await prisma.product.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
  revalidatePath("/dashboard/products");
  return { ok: true as const, message: "Product restored as inactive." };
}
