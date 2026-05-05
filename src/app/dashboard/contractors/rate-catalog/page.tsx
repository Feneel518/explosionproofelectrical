import ContractorCatalogManager from "@/components/dashboard/contractors/ContractorCatalogManager";
import RateCatalogFilters from "@/components/dashboard/contractors/RateCatalogFilters";
import { prisma } from "@/lib/prisma/db";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import {
  buildRateOrderBy,
  buildRateWhere,
} from "@/lib/helpers/RepoHelpers/ContractorRepo";
import {
  rateCatalogSearchParamsCache,
  ContractorCatalogStatusOptions,
  ContractorRoleFilterOptions,
} from "@/lib/searchParams/dashboard/contractors/rateCatalogSearchParams";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp = rateCatalogSearchParamsCache.parse(raw);

  const [products, operations, rates] = await Promise.all([
    prisma.contractorProduct.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        deletedAt: true,
        _count: { select: { rates: true } },
      },
    }),
    prisma.contractorOperation.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        deletedAt: true,
        _count: { select: { rates: true } },
      },
    }),
    prisma.contractorRate.findMany({
      where: buildRateWhere(sp),
      orderBy: buildRateOrderBy(sp),
      take: Math.min(100, Math.max(10, sp.pageSize)),
      skip: (sp.page - 1) * Math.min(100, Math.max(10, sp.pageSize)),
      select: {
        id: true,
        sideLabel: true,
        unit: true,
        defaultRate: true,
        role: true,
        status: true,
        notes: true,
        deletedAt: true,
        contractorProductId: true,
        contractorOperationId: true,
        contractorProduct: { select: { name: true } },
        contractorOperation: { select: { name: true } },
      },
    }),
  ]);

  const productRows = products.map((item) => ({
    ...item,
    rateCount: item._count.rates,
  }));
  const operationRows = operations.map((item) => ({
    ...item,
    rateCount: item._count.rates,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rate Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Maintain workshop products, operations, and exact piece-rate rows.
        </p>
      </div>

      <RateCatalogFilters
        initialQ={sp.q}
        initialProductId={sp.productId}
        initialOperationId={sp.operationId}
        initialStatus={sp.status}
        initialRole={sp.role}
        products={serializeForClient(productRows.map((product) => ({ id: product.id, name: product.name })))}
        operations={serializeForClient(
          operationRows.map((operation) => ({ id: operation.id, name: operation.name })),
        )}
        statuses={ContractorCatalogStatusOptions}
        roles={ContractorRoleFilterOptions}
      />

      <ContractorCatalogManager
        products={serializeForClient(productRows)}
        operations={serializeForClient(operationRows)}
        rates={serializeForClient(rates)}
      />
    </div>
  );
}
