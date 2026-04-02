import SuppliersTable from "@/components/dashboard/supplier/SuppliersTable";
import {
  buildSuppliersOrderBy,
  buildSupplierWhere,
} from "@/lib/helpers/RepoHelpers/SupplierRepo";
import { prisma } from "@/lib/prisma/db";
import { suppliersSearchParamsCache } from "@/lib/searchParams/dashboard/suppliers/suppliersSearchParams";
import { FC } from "react";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

interface pageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = suppliersSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = await buildSupplierWhere(sp);
  const orderBy = await buildSuppliersOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        city: true,
        state: true,
        gstin: true,
        status: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.supplier.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage suppliers, addresses, GSTIN and status.
          </p>
        </div>
      </div>

      <SuppliersTable
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

