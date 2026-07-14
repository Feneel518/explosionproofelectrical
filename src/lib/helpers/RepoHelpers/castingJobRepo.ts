import { CastingJobQP } from "@/lib/searchParams/dashboard/manufacturing/casting-job/CastingJobSearchParams";
import { Prisma } from "@prisma/client";

export function buildCastingJobWhere(
  sp: CastingJobQP,
): Prisma.CastingJobWhereInput {
  const and: Prisma.CastingJobWhereInput[] = [];

  if (sp.q) {
    and.push({
      OR: [
        { workerNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { supplier: { companyName: { contains: sp.q, mode: "insensitive" } } },
        { remarks: { contains: sp.q, mode: "insensitive" } },
      ],
    });
  }

  if (sp.status !== "ALL") {
    and.push({ status: sp.status as any });
  }

  if (sp.workerType !== "ALL") {
    and.push({ workerType: sp.workerType as any });
  }

  if (sp.fy) {
    and.push({ jobFy: sp.fy });
  }

  return and.length ? { AND: and } : {};
}

type CastingJobOrderBy =
  | Prisma.CastingJobOrderByWithRelationInput
  | Prisma.CastingJobOrderByWithRelationInput[];

export function buildCastingJobOrderBy(sp: CastingJobQP): CastingJobOrderBy {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "issueDate":
      return { issueDate: dir };
    case "jobNo":
      return [{ jobFy: dir }, { jobNo: dir }];
    case "workerNameSnapshot":
      return { workerNameSnapshot: dir };
    case "totalPendingWeightKg":
      return { totalPendingWeightKg: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}
