"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  SupplierSchema,
  SupplierSchemaRequest,
} from "@/lib/validators/dashboard/suppliers/SupplierValidator";
import { revalidatePath } from "next/cache";

export const createSupplierAction = async (values: SupplierSchemaRequest) => {
  await requireAuth();

  const parsed = SupplierSchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  try {
    const response = await prisma.supplier.create({
      data: {
        companyName: String(data.companyName || "").trim(),
        companyEmail: data.companyEmail
          ? String(data.companyEmail).trim()
          : null,
        companyPhone: data.companyPhone
          ? String(data.companyPhone).trim()
          : null,
        addressLine1: String(data.addressLine1 || "").trim(),
        addressLine2: data.addressLine2
          ? String(data.addressLine2).trim()
          : null,
        city: String(data.city || "").trim(),
        state: String(data.state || "").trim(),
        country: String(data.country || "").trim(),
        pincode: String(data.pincode || "").trim(),
        gstin: data.gstin ? String(data.gstin).trim() : null,
        status: (data.status as any) ?? "ACTIVE",
      },
    });
    revalidatePath("/dashboard/suppliers");
    return {
      ok: true,
      message: "Supplier created successfully.",
      data: {
        id: response.id,
        companyName: response.companyName,
        city: response.city,
        state: response.state,
        gstin: response.gstin,
        companyPhone: response.companyPhone,
        companyEmail: response.companyEmail,
      },
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create supplier.");
  }
};

