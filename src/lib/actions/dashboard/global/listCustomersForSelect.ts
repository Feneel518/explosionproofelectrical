import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export type CustomerSelectItem = {
  id: string;
  companyName: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  defaultQuotationGst: string;
  defaultQuotationPackingCharges: string;
  defaultQuotationTransportationPayment: string;
  defaultQuotationPaymentTerms: string;
  defaultQuotationDeliveryDate: string | null;
};
export const listCustomersForSelect = async () => {
  await requirePermission("master.read");

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
      defaultQuotationGst: true,
      defaultQuotationPackingCharges: true,
      defaultQuotationTransportationPayment: true,
      defaultQuotationPaymentTerms: true,
      defaultQuotationDeliveryDate: true,
    },
    orderBy: { companyName: "asc" },
    take: 500, // keep it sane
  });

  return customers;
};
