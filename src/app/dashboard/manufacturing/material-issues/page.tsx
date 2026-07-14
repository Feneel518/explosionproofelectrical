import { FC } from "react";

import MaterialIssueTable from "@/components/dashboard/manufacturing/material-issue/MaterialIssueTable";
import { prisma } from "@/lib/prisma/db";
import { materialIssueSearchParamsCache } from "@/lib/searchParams/dashboard/manufacturing/material-issue/MaterialIssueSearchParams";
import {
  buildMaterialIssueOrderBy,
  buildMaterialIssueWhere,
} from "@/lib/helpers/RepoHelpers/materialIssueRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const Page: FC<PageProps> = async ({ searchParams }) => {
  const sp = materialIssueSearchParamsCache.parse(await searchParams);
  const page = Math.max(1, sp.page);
  const pageSize = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildMaterialIssueWhere(sp);
  const orderBy = buildMaterialIssueOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.materialIssue.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        issueNo: true,
        issueFy: true,
        status: true,
        issueType: true,
        issueDate: true,
        issuedToNameSnapshot: true,
        issuedByNameSnapshot: true,
        directSaleReferenceNo: true,
        department: true,
        purpose: true,
        createdAt: true,
        items: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.materialIssue.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Material Issues</h1>
        <p className="text-sm text-muted-foreground">
          Track raw materials issued for internal jobs or direct sale from stock.
        </p>
      </div>
      <MaterialIssueTable
        items={safeItems as any}
        total={total}
        page={page}
        pageSize={pageSize}
        qp={sp}
      />
    </div>
  );
};

export default Page;
