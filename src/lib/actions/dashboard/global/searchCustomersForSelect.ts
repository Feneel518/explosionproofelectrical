"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export type CustomerSearchItem = {
  id: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  defaultQuotationGst: string;
  defaultQuotationPackingCharges: string;
  defaultQuotationTransportationPayment: string;
  defaultQuotationPaymentTerms: string;
  defaultQuotationDeliveryDate: string | null;
};

export type CustomerSearchResponse = {
  items: CustomerSearchItem[];
  nextCursor: string | null;
};

export const searchCustomersForSelectAction = async ({
  query,
  cursor,
  take,
}: {
  query: string;
  cursor: string | null;
  take: number;
}): Promise<CustomerSearchResponse> => {
  await requireAuth();

  const q = (query ?? "").trim();

  const takeQty = Math.min(Math.max(take ?? 50, 5), 50);

  const where = {
    deletedAt: null,
    status: "ACTIVE" as const,
    ...(q
      ? {
          OR: [
            { companyName: { contains: q, mode: "insensitive" as const } },
            { companyEmail: { contains: q, mode: "insensitive" as const } },
            { companyPhone: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const rows = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      gstin: true,
      city: true,
      state: true,
      defaultQuotationGst: true,
      defaultQuotationPackingCharges: true,
      defaultQuotationTransportationPayment: true,
      defaultQuotationPaymentTerms: true,
      defaultQuotationDeliveryDate: true,
    },
    orderBy: [{ companyName: "asc" }, { id: "asc" }],
    take: takeQty + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = rows.length > takeQty;
  const items = hasMore ? rows.slice(0, takeQty) : rows;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
};
