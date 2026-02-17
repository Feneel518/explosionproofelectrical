import { CustomersQP } from "@/lib/searchParams/dashboard/customers/customersSearchParams";
import { Prisma } from "@prisma/client";

export const buildCustomerWhere = async (qp: CustomersQP) => {
  const and: Prisma.CustomerWhereInput[] = [];

  const sp = qp;

  // soft delete filter
  if (sp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (sp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  //   search
  if (sp.q) {
    and.push({
      OR: [
        { companyName: { contains: sp.q, mode: "insensitive" as const } },
        { companyEmail: { contains: sp.q, mode: "insensitive" as const } },
        { companyPhone: { contains: sp.q, mode: "insensitive" as const } },
        { gstin: { contains: sp.q, mode: "insensitive" as const } },
        { city: { contains: sp.q, mode: "insensitive" as const } },
      ],
    });
  }

  // filters
  if (sp.city)
    and.push({ city: { equals: sp.city, mode: "insensitive" as const } });

  if (sp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (sp.status === "INACTIVE") and.push({ status: "INACTIVE" });

  return { AND: and };
};

export const buildCustomersOrderBy = async (qp: CustomersQP) => {
  const sp = qp;

  const dir = sp.dir;
  switch (sp.sort) {
    case "companyName":
      return { companyName: dir };
    case "city":
      return { city: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
};
