"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import {
  getProductApprovalSettings,
  toApprovalPayload,
} from "@/lib/products/approval";
import { sendProductApprovalEmail } from "@/lib/products/approvalEmail";
import {
  ProductSchema,
  ProductSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductValidator";
import { revalidatePath } from "next/cache";

export const createProductAction = async (values: ProductSchemaRequest) => {
  const session = await requireAuth();
  const parsed = ProductSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: "Enter the fields properly." };
  }

  const data = parsed.data;
  try {
    const settings = await getProductApprovalSettings();
    await prisma.productApprovalRequest.create({
      data: {
        type: "PRODUCT_CREATE",
        title: data.name,
        payload: toApprovalPayload(data),
        requesterId: session.user.id,
      },
    });

    if (settings.sendEmailNotifications) {
      await sendProductApprovalEmail({
        email: settings.approvalEmail,
        title: data.name,
        type: "PRODUCT_CREATE",
      });
    }

    revalidatePath("/superadmin");
    return {
      ok: true,
      message: "Product submitted for owner approval. It is not live yet.",
    };
  } catch {
    return { ok: false, message: "Failed to submit product for approval" };
  }
};
