import CategoriesTable from "@/components/dashboard/category/CategoryTable";
import {
  buildCategoriesOrderBy,
  buildCategoriesWhere,
} from "@/lib/helpers/RepoHelpers/CategoryRepo";
import { prisma } from "@/lib/prisma/db";
import {
  catgeoryParsers,
  catgeorySearchParamsCache,
} from "@/lib/searchParams/dashboard/categories/categoriesSearchParams";
import { FC } from "react";

interface pageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = catgeorySearchParamsCache.parse(await searchParams);
  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildCategoriesWhere(sp);
  const orderBy = buildCategoriesOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        description: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.category.count({ where }),
  ]);
  return (
    <div className="space-y-6 ">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories, status, and soft deletion.
          </p>
        </div>

        {/* Add button can open a dialog like customers page */}
        {/* <AddCategoryDialog /> */}
      </div>

      <CategoriesTable
        items={items}
        total={total}
        page={pageParams}
        pageSize={pageSizeParams}
        qp={sp}
      />
    </div>
  );
};

export default page;
