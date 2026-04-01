import { MaterialIssueQP } from "@/lib/searchParams/dashboard/manufacturing/material-issue/MaterialIssueSearchParams";
import { Prisma } from "@prisma/client";

export function buildMaterialIssueWhere(
  sp: MaterialIssueQP,
): Prisma.MaterialIssueWhereInput {
  const and: Prisma.MaterialIssueWhereInput[] = [];

  if (sp.q) {
    and.push({
      OR: [
        { issuedToNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { issuedByNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { directSaleCustomerNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { directSaleReferenceNo: { contains: sp.q, mode: "insensitive" } },
        { department: { contains: sp.q, mode: "insensitive" } },
        { purpose: { contains: sp.q, mode: "insensitive" } },
        { workReference: { contains: sp.q, mode: "insensitive" } },
      ],
    });
  }

  if (sp.status !== "ALL") {
    and.push({ status: sp.status as any });
  }

  if (sp.fy) {
    and.push({ issueFy: sp.fy });
  }

  return and.length ? { AND: and } : {};
}

type MaterialIssueOrderBy =
  | Prisma.MaterialIssueOrderByWithRelationInput
  | Prisma.MaterialIssueOrderByWithRelationInput[];

export function buildMaterialIssueOrderBy(sp: MaterialIssueQP): MaterialIssueOrderBy {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "issueDate":
      return { issueDate: dir };
    case "issueNo":
      return [{ issueFy: dir }, { issueNo: dir }];
    case "issuedToNameSnapshot":
      return { issuedToNameSnapshot: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}
