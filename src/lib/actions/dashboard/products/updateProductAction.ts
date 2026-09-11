"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import { getProductApprovalSettings, toApprovalPayload } from "@/lib/products/approval";
import { sendProductApprovalEmail } from "@/lib/products/approvalEmail";
import {
  ProductSchema,
  ProductSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductValidator";
import { revalidatePath } from "next/cache";

export const updateProductAction = async (values: ProductSchemaRequest) => {
  const session = await requireAuth();
  const parsed = ProductSchema.safeParse(values);
  if (!parsed.success) return fail("Enter the fields properly.");

  const data = parsed.data;
  if (!data.id) return fail("Product not found");

  try {
    const existing = await prisma.product.findUnique({
      where: { id: data.id },
      select: { id: true, deletedAt: true },
    });
    if (!existing) return fail("Product not found");
    if (existing.deletedAt) return fail("Cannot edit a deleted product. Restore it first.");

    const settings = await getProductApprovalSettings();
    await prisma.productApprovalRequest.create({
      data: {
        type: "PRODUCT_UPDATE",
        title: data.name,
        payload: toApprovalPayload(data),
        requesterId: session.user.id,
        targetRecordId: data.id,
      },
    });

    if (settings.sendEmailNotifications) {
      await sendProductApprovalEmail({
        email: settings.approvalEmail,
        title: data.name,
        type: "PRODUCT_UPDATE",
      });
    }

    revalidatePath("/superadmin");
    return {
      ok: true,
      message: "Product changes submitted for owner approval. The live product is unchanged.",
    };
  } catch {
    return fail("This product already has a pending edit, or the request could not be submitted.");
  }
};
