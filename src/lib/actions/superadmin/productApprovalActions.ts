"use server";

import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  APPROVAL_SETTINGS_ID,
  productCreateData,
  variantCreateData,
} from "@/lib/products/approval";
import { requireProductOwner } from "@/lib/check/requireProductOwner";
import { ProductSchema } from "@/lib/validators/dashboard/products/ProductValidator";
import { ProductVariantSchema } from "@/lib/validators/dashboard/products/ProductVariantValidator";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  sendEmailNotifications: z.boolean(),
});

export async function updateProductApprovalSettingsAction(values: {
  sendEmailNotifications: boolean;
}) {
  await requireProductOwner();
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return fail("Invalid approval settings.");

  await prisma.productApprovalSettings.upsert({
    where: { id: APPROVAL_SETTINGS_ID },
    update: {
      ...parsed.data,
      requireProductApproval: true,
      requireVariantApproval: true,
    },
    create: {
      id: APPROVAL_SETTINGS_ID,
      ...parsed.data,
      requireProductApproval: true,
      requireVariantApproval: true,
    },
  });
  revalidatePath("/superadmin");
  return { ok: true as const, message: "Approval settings saved." };
}

export async function reviewProductApprovalAction(
  requestId: string,
  decision: "APPROVE" | "REJECT",
  note?: string,
) {
  const session = await requireProductOwner();
  const review = z.object({
    requestId: z.uuid(),
    decision: z.enum(["APPROVE", "REJECT"]),
    note: z.string().trim().max(2000).optional(),
  }).safeParse({ requestId, decision, note });
  if (!review.success) return fail("Invalid review decision or note (maximum 2,000 characters).");
  const request = await prisma.productApprovalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) return fail("Approval request not found.");
  if (request.status !== "PENDING") return fail("This request was already reviewed.");

  if (decision === "REJECT") {
    const changed = await prisma.productApprovalRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote: note?.trim() || null,
      },
    });
    if (changed.count !== 1) return fail("This request was already reviewed.");
    revalidatePath("/superadmin");
    return { ok: true as const, message: "Request rejected. Nothing was added." };
  }

  const parsed =
    request.type === "PRODUCT_CREATE"
      ? ProductSchema.safeParse(request.payload)
      : ProductVariantSchema.safeParse(request.payload);
  if (!parsed.success) return fail("The stored request is invalid and cannot be approved.");

  try {
    const createdId = await prisma.$transaction(async (tx) => {
      const claimed = await tx.productApprovalRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote: note?.trim() || null,
        },
      });
      if (claimed.count !== 1) throw new Error("ALREADY_REVIEWED");

      let created: { id: string };
      if (request.type === "PRODUCT_CREATE") {
        created = await tx.product.create({
          data: productCreateData(ProductSchema.parse(request.payload)),
          select: { id: true },
        });
      } else {
        const data = ProductVariantSchema.parse(request.payload);
        const parent = await tx.product.findFirst({
          where: { id: data.productId, deletedAt: null },
          select: { id: true },
        });
        if (!parent) throw new Error("PARENT_UNAVAILABLE");
        created = await tx.productVariant.create({
          data: variantCreateData(data),
          select: { id: true },
        });
      }

      await tx.productApprovalRequest.update({
        where: { id: requestId },
        data: { createdRecordId: created.id },
      });
      return created.id;
    });

    revalidatePath("/superadmin");
    revalidatePath("/dashboard/products");
    revalidatePath("/catalog", "layout");
    revalidatePath("/");
    if (request.type === "VARIANT_CREATE") {
      const payload = ProductVariantSchema.parse(request.payload);
      revalidatePath(`/dashboard/products/${payload.productId}`);
    }
    return {
      ok: true as const,
      message: `Approved and added to the catalogue (${createdId.slice(0, 8)}).`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "PARENT_UNAVAILABLE") {
      return fail("The parent product was removed. Restore it before approving this variant.");
    }
    if (error instanceof Error && error.message === "ALREADY_REVIEWED") {
      return fail("This request was already reviewed.");
    }
    return fail("Could not approve this request. Check for a duplicate slug, SKU, or variant name.");
  }
}
