"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import {
  CustomerSchema,
  CustomerSchemaRequest,
} from "@/lib/validators/dashboard/customers/CustomerValidator";
import { fail } from "assert";
import { revalidatePath } from "next/cache";

export const updateCustomerAction = async (values: CustomerSchemaRequest) => {
  await requireAuth();

  const parsed = CustomerSchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  if (!data.id) {
    return {
      ok: false,
      message: "No Customer Id received to update the customer.",
    };
  }

  try {
    const existing = await prisma.customer.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!existing) {
      return {
        ok: false,
        message:
          "No Customer found in the database, please proceed to create a new one.",
      };
    }

    const response = await prisma.customer.update({
      where: {
        id: data.id,
      },
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

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${response.id}`);
    return {
      ok: true,
      message: "Customer created successfully.",
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create customer.");
  }
};
