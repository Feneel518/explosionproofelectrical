import { RawMaterialsQP } from "@/lib/searchParams/dashboard/raw-materials/rawMaterialsSearchParams";
import { Prisma } from "@prisma/client";

export const buildRawMaterialWhere = (qp: RawMaterialsQP) => {
  const and: Prisma.RawMaterialWhereInput[] = [];

  if (qp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (qp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  if (qp.q) {
    and.push({
      OR: [
        { companyItemName: { contains: qp.q, mode: "insensitive" as const } },
        { supplierItemName: { contains: qp.q, mode: "insensitive" as const } },
        { itemCode: { contains: qp.q, mode: "insensitive" as const } },
        { hsnCode: { contains: qp.q, mode: "insensitive" as const } },
        { description: { contains: qp.q, mode: "insensitive" as const } },
      ],
    });
  }

  if (qp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (qp.status === "INACTIVE") and.push({ status: "INACTIVE" });

  return { AND: and };
};

export const buildRawMaterialsOrderBy = (qp: RawMaterialsQP) => {
  const dir = qp.dir;

  switch (qp.sort) {
    case "companyItemName":
      return { companyItemName: dir };
    case "itemCode":
      return { itemCode: dir };
    case "updatedAt":
      return { updatedAt: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
};
