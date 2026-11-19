"use server";

import { requirePermission } from "@/lib/check/permissions";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { getProductApprovalSettings, toApprovalPayload } from "@/lib/products/approval";
import { sendProductApprovalEmail } from "@/lib/products/approvalEmail";
import {
  ProductVariantSchema,
  ProductVariantSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductVariantValidator";
import { revalidatePath } from "next/cache";
import { catalogProductName } from "@/lib/products/catalogNames";

export const updateProductVariantAction = async (
  values: ProductVariantSchemaRequest,
) => {
  const session = await requirePermission("master.write");
  const parsed = ProductVariantSchema.safeParse(values);
  if (!parsed.success) return fail("Enter the fields properly.");

  const data = parsed.data;
  if (!data.id) return fail("Product variant not found");

  try {
    const existing = await prisma.productVariant.findUnique({
      where: { id: data.id },
      select: { id: true, productId: true, product: { select: { name: true, displayName: true, deletedAt: true } } },
    });
    if (!existing) return fail("Product variant not found");
    if (existing.productId !== data.productId) return fail("Invalid product");
    if (existing.product.deletedAt) return fail("Cannot edit a variant of a deleted product.");

    const settings = await getProductApprovalSettings();
    const title = `${catalogProductName(existing.product)} — ${data.variant}`;
    await prisma.productApprovalRequest.create({
      data: {
        type: "VARIANT_UPDATE",
        title,
        payload: toApprovalPayload(data),
        requesterId: session.user.id,
        targetRecordId: data.id,
      },
    });

    if (settings.sendEmailNotifications) {
      await sendProductApprovalEmail({
        email: settings.approvalEmail,
        title,
        type: "VARIANT_UPDATE",
      });
    }

    revalidatePath("/superadmin");
    return {
      ok: true,
      message: "Variant changes submitted for owner approval. The live variant is unchanged.",
    };
  } catch {
    return fail("This variant already has a pending edit, or the request could not be submitted.");
  }
};
