import { CustomersQP } from "@/lib/searchParams/dashboard/customers/customersSearchParams";
import { ProductsQP } from "@/lib/searchParams/dashboard/products/productsSearchParams";
import { Prisma } from "@prisma/client";

export const buildProductWhere = async (qp: ProductsQP) => {
  const and: Prisma.ProductWhereInput[] = [];

  const sp = qp;

  // soft delete filter
  if (sp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (sp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  //   search
  if (sp.q) {
    and.push({
      OR: [
        { name: { contains: sp.q, mode: "insensitive" as const } },
        { hsnCode: { contains: sp.q, mode: "insensitive" as const } },
      ],
    });
  }

  if (sp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (sp.status === "INACTIVE") and.push({ status: "INACTIVE" });

  return { AND: and };
};

export const buildProductsOrderBy = async (qp: ProductsQP) => {
  const sp = qp;

  const dir = sp.dir;
  switch (sp.sort) {
    case "name":
      return { name: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
};
