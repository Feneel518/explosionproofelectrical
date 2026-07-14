import { FC } from "react";

import CastingJobTable from "@/components/dashboard/manufacturing/casting-job/CastingJobTable";
import {
  buildCastingJobOrderBy,
  buildCastingJobWhere,
} from "@/lib/helpers/RepoHelpers/castingJobRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";
import { castingJobSearchParamsCache } from "@/lib/searchParams/dashboard/manufacturing/casting-job/CastingJobSearchParams";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const Page: FC<PageProps> = async ({ searchParams }) => {
  const sp = castingJobSearchParamsCache.parse(await searchParams);
  const page = Math.max(1, sp.page);
  const pageSize = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildCastingJobWhere(sp);
  const orderBy = buildCastingJobOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.castingJob.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        jobNo: true,
        jobFy: true,
        status: true,
        workerType: true,
        workerNameSnapshot: true,
        issueDate: true,
        expectedReturnDate: true,
        totalIssuedQty: true,
        totalIssuedWeightKg: true,
        totalReceivedQty: true,
        totalReceivedWeightKg: true,
        totalPendingWeightKg: true,
        yieldPercent: true,
        createdAt: true,
        supplier: {
          select: {
            companyName: true,
          },
        },
      },
    }),
    prisma.castingJob.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Casting Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Track aluminum issue to workers and casting receipt by quantity and weight.
        </p>
      </div>

      <CastingJobTable
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
