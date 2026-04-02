import { CastingMastersQP } from "@/lib/searchParams/dashboard/casting-masters/castingMastersSearchParams";
import { Prisma } from "@prisma/client";

export const buildCastingMasterWhere = (qp: CastingMastersQP) => {
  const and: Prisma.CastingMasterWhereInput[] = [];

  if (qp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (qp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  if (qp.q) {
    and.push({
      OR: [
        { castingItemName: { contains: qp.q, mode: "insensitive" as const } },
        { castingCode: { contains: qp.q, mode: "insensitive" as const } },
        { drawingNumber: { contains: qp.q, mode: "insensitive" as const } },
        { hsnCode: { contains: qp.q, mode: "insensitive" as const } },
        { description: { contains: qp.q, mode: "insensitive" as const } },
      ],
    });
  }

  if (qp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (qp.status === "INACTIVE") and.push({ status: "INACTIVE" });

  return { AND: and };
};

export const buildCastingMastersOrderBy = (qp: CastingMastersQP) => {
  const dir = qp.dir;

  switch (qp.sort) {
    case "castingItemName":
      return { castingItemName: dir };
    case "castingCode":
      return { castingCode: dir };
    case "updatedAt":
      return { updatedAt: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
};
