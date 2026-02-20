"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { ActionResult, fail } from "@/lib/helpers/actionHelpers/ActionResult";
import { prisma } from "@/lib/prisma/db";
import {
  CustomerSchema,
  CustomerSchemaRequest,
} from "@/lib/validators/dashboard/customers/CustomerValidator";
import { revalidatePath } from "next/cache";

export const createCustomerAction = async (values: CustomerSchemaRequest) => {
  await requireAuth();

  const parsed = CustomerSchema.safeParse(values);

  if (!parsed.success || parsed.error) {
    return {
      ok: false,
      message: "Enter the fields properly.",
    };
  }

  const data = parsed.data;

  try {
    const response = await prisma.customer.create({
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
    if (data.companyEmail) {
      const newsLetter = await prisma.newsletterSubscriber.upsert({
        where: {
          email: data.companyEmail,
        },
        create: {
          email: data.companyEmail.toLowerCase().trim(),
          name: data.companyName,
          status: "SUBSCRIBED",
          source: "CUSTOMER",
          customerId: data.id,
        },
        update: {
          status: "SUBSCRIBED",
          name: data.companyName,
          source: "CUSTOMER",
          customerId: data.id,
          unsubscribedAt: null,
        },
      });
    }

    revalidatePath("/dashboard/customers");
    return {
      ok: true,
      message: "Customer created successfully.",
    };
  } catch (error: any) {
    return fail(error?.message ?? "Failed to create customer.");
  }
};
