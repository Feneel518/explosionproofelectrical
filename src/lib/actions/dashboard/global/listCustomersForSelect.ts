import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export type CustomerSelectItem = {
  id: string;
  companyName: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
};
export const listCustomersForSelect = async () => {
  await requireAuth();

  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      city: true,
      state: true,
      gstin: true,
    },
    orderBy: { companyName: "asc" },
    take: 500, // keep it sane
  });

  return customers;
};
