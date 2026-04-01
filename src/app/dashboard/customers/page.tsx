import CustomersTable from "@/components/dashboard/customer/CustomersTable";
import {
  buildCustomersOrderBy,
  buildCustomerWhere,
} from "@/lib/helpers/RepoHelpers/CustomerRepo";
import { prisma } from "@/lib/prisma/db";
import { customersSearchParamsCache } from "@/lib/searchParams/dashboard/customers/customersSearchParams";
import { FC } from "react";

interface pageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = customersSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = await buildCustomerWhere(sp);
  const orderBy = await buildCustomersOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
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
    prisma.customer.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customers, addresses, GSTIN and status.
          </p>
        </div>
      </div>

      <CustomersTable
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
