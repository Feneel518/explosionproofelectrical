import { FC } from "react";

import RawMaterialsTable from "@/components/dashboard/raw-material/RawMaterialsTable";
import {
  buildRawMaterialWhere,
  buildRawMaterialsOrderBy,
} from "@/lib/helpers/RepoHelpers/RawMaterialRepo";
import { prisma } from "@/lib/prisma/db";
import { rawMaterialsSearchParamsCache } from "@/lib/searchParams/dashboard/raw-materials/rawMaterialsSearchParams";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const Page: FC<PageProps> = async ({ searchParams }) => {
  const sp = rawMaterialsSearchParamsCache.parse(await searchParams);

  const page = Math.max(1, sp.page);
  const pageSize = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildRawMaterialWhere(sp);
  const orderBy = buildRawMaterialsOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.rawMaterial.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        companyItemName: true,
        supplierItemName: true,
        itemCode: true,
        hsnCode: true,
        unit: true,
        reorderLevel: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        preferredSupplier: {
          select: {
            companyName: true,
          },
        },
      },
    }),
    prisma.rawMaterial.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raw Materials</h1>
          <p className="text-sm text-muted-foreground">
            Maintain purchase and stock item names for supplier and company mapping.
          </p>
        </div>
      </div>

      <RawMaterialsTable
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
