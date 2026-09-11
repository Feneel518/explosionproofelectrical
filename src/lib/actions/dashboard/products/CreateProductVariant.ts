"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  getProductApprovalSettings,
  toApprovalPayload,
} from "@/lib/products/approval";
import { sendProductApprovalEmail } from "@/lib/products/approvalEmail";
import {
  ProductVariantSchema,
  ProductVariantSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductVariantValidator";
import { revalidatePath } from "next/cache";

export const createProductVariantAction = async (
  values: ProductVariantSchemaRequest,
) => {
  const session = await requireAuth();
  const parsed = ProductVariantSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Enter the fields properly." };
  }

  const data = parsed.data;
  try {
    const settings = await getProductApprovalSettings();
    const product = await prisma.product.findFirst({
      where: { id: data.productId, deletedAt: null },
      select: { name: true },
    });
    if (!product) return fail("Product not found");

    const title = `${product.name} — ${data.variant}`;
    await prisma.productApprovalRequest.create({
      data: {
        type: "VARIANT_CREATE",
        title,
        payload: toApprovalPayload(data),
        requesterId: session.user.id,
      },
    });

    if (settings.sendEmailNotifications) {
      await sendProductApprovalEmail({
        email: settings.approvalEmail,
        title,
        type: "VARIANT_CREATE",
      });
    }

    revalidatePath("/superadmin");
    return {
      ok: true,
      message: "Variant submitted for owner approval. It is not live yet.",
    };
  } catch {
    return fail("Failed to submit product variant for approval");
  }
};
