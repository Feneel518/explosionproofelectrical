import { catgeoryQP } from "@/lib/searchParams/dashboard/categories/categoriesSearchParams";
import { Prisma } from "@prisma/client";

export function buildCategoriesWhere(sp: catgeoryQP) {
  const and: Prisma.CategoryWhereInput[] = [];

  // soft delete filter
  if (sp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (sp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  if (sp.q) {
    and.push({
      OR: [
        { name: { contains: sp.q, mode: "insensitive" } },
        { slug: { contains: sp.q, mode: "insensitive" } },
        { description: { contains: sp.q, mode: "insensitive" } },
      ],
    });
  }

  if (sp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (sp.status === "INACTIVE") and.push({ status: "INACTIVE" });

  return { AND: and };
}

export function buildCategoriesOrderBy(qp: catgeoryQP) {
  const sp = qp;

  const dir = sp.dir;
  switch (sp.sort) {
    case "name":
      return { name: dir };
    case "status":
      return { status: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}
