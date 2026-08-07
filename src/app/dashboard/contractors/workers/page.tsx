import WorkersTable from "@/components/dashboard/contractors/WorkersTable";
import {
  buildWorkerOrderBy,
  buildWorkerWhere,
} from "@/lib/helpers/RepoHelpers/ContractorRepo";
import { prisma } from "@/lib/prisma/db";
import {
  workersSearchParamsCache,
} from "@/lib/searchParams/dashboard/contractors/workersSearchParams";
import { FC } from "react";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

interface pageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = workersSearchParamsCache.parse(await searchParams);
  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = { AND: [buildWorkerWhere(sp), { kind: "MACHINING" as const }] };
  const orderBy = buildWorkerOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.worker.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        code: true,
        name: true,
        role: true,
        phone: true,
        status: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.worker.count({ where }),
  ]);
  const safeItems = serializeForClient(items);
  return (
    <div className="space-y-6 ">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workers</h1>
          <p className="text-sm text-muted-foreground">
            Manage contractors / piece-rate workers.
          </p>
        </div>
      </div>

      <WorkersTable
        items={safeItems}
        total={total}
        page={pageParams}
        pageSize={pageSizeParams}
        qp={sp}
      />
    </div>
  );
};

export default page;
