import { FC } from "react";

import CastingMastersTable from "@/components/dashboard/casting-master/CastingMastersTable";
import {
  buildCastingMasterWhere,
  buildCastingMastersOrderBy,
} from "@/lib/helpers/RepoHelpers/CastingMasterRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";
import { castingMastersSearchParamsCache } from "@/lib/searchParams/dashboard/casting-masters/castingMastersSearchParams";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const Page: FC<PageProps> = async ({ searchParams }) => {
  const sp = castingMastersSearchParamsCache.parse(await searchParams);

  const page = Math.max(1, sp.page);
  const pageSize = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildCastingMasterWhere(sp);
  const orderBy = buildCastingMastersOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.castingMaster.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        castingItemName: true,
        castingCode: true,
        drawingNumber: true,
        hsnCode: true,
        unit: true,
        standardWeightKg: true,
        reorderLevel: true,
        status: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.castingMaster.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Casting Masters</h1>
          <p className="text-sm text-muted-foreground">
            Maintain casting catalog used in job-worker receipts and casting stock.
          </p>
        </div>
      </div>

      <CastingMastersTable
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
