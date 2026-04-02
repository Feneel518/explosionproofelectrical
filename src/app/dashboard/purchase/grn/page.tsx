import { FC } from "react";

import GrnTable from "@/components/dashboard/purchase/grn/GrnTable";
import { prisma } from "@/lib/prisma/db";
import { grnSearchParamsCache } from "@/lib/searchParams/dashboard/purchase/grn/GrnSearchParams";
import { buildGrnOrderBy, buildGrnWhere } from "@/lib/helpers/RepoHelpers/grnRepo";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const Page: FC<PageProps> = async ({ searchParams }) => {
  const sp = grnSearchParamsCache.parse(await searchParams);
  const page = Math.max(1, sp.page);
  const pageSize = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildGrnWhere(sp);
  const orderBy = buildGrnOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.goodsReceiptNote.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        grnNo: true,
        grnFy: true,
        status: true,
        materialCheckStatus: true,
        quantityCheckStatus: true,
        discrepancyAction: true,
        supplierNameSnapshot: true,
        supplierInvoiceNo: true,
        supplierInvoiceDate: true,
        receivedAt: true,
        createdAt: true,
        items: { select: { id: true } },
      },
    }),
    prisma.goodsReceiptNote.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GRN</h1>
        <p className="text-sm text-muted-foreground">
          Record inward material receipts and post stock in inventory.
        </p>
      </div>
      <GrnTable
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
