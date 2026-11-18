import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export type SupplierSelectItem = {
  id: string;
  companyName: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
};
export const listSuppliersForSelect = async () => {
  await requirePermission("master.read");

  const suppliers = await prisma.supplier.findMany({
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

  return suppliers;
};
