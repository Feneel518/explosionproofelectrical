import ProductsTable from "@/components/dashboard/product/ProductsTable";
import {
  buildProductsOrderBy,
  buildProductWhere,
} from "@/lib/helpers/RepoHelpers/ProductRepo";
import { prisma } from "@/lib/prisma/db";
import { ProductsSearchParamsCache } from "@/lib/searchParams/dashboard/products/productsSearchParams";
import { FC } from "react";

interface pageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = ProductsSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = await buildProductWhere(sp);
  const orderBy = await buildProductsOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        name: true,
        hsnCode: true,
        category: {
          select: {
            name: true,
            id: true,
          },
        },

        variants: {
          select: { id: true },
        },

        status: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage products, variants, drawings and stuff.
          </p>
        </div>
      </div>

      <ProductsTable
        items={items}
        total={total}
        page={pageParams}
        pageSize={pageSizeParams}
        qp={sp}
        categories={categories}
      />
    </div>
  );
};

export default page;
