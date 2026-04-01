"use server";

import { prisma } from "@/lib/prisma/db";
import { requireAuth } from "@/lib/check/requireAuth";
import type { CustomerSearchItem } from "./searchCustomersForSelect";

export async function getCustomerForSelectById(
  id: string,
): Promise<CustomerSearchItem | null> {
  await requireAuth();

  const c = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      city: true,
    },
  });

  return c;
}
