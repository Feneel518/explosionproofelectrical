import OrderTable from "@/components/dashboard/sales/order/OrderTable";
import { buttonVariants } from "@/components/ui/button";
import {
  buildSalesOrdersOrderBy,
  buildSalesOrderWhere,
} from "@/lib/helpers/RepoHelpers/orderRepo";
import { prisma } from "@/lib/prisma/db";
import { orderSearchParamsCache } from "@/lib/searchParams/dashboard/sales/order/OrderSearchParams";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<PageProps> = async ({ searchParams }) => {
  const sp = orderSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildSalesOrderWhere(sp);
  const orderBy = buildSalesOrdersOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        orderNo: true,
        orderFy: true,
        status: true,
        sourceType: true,

        clientName: true,
        clientNameSnapshot: true,

        poNumber: true,
        poDate: true,
        orderDate: true,

        customerId: true,
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },

        quotationId: true,
        quotation: {
          select: {
            id: true,
            quoteNo: true,
            quoteFy: true,
          },
        },

        grandTotal: true,
        totalItemsCount: true,
        totalOrderedQty: true,
        totalDispatchedQty: true,
        totalInvoicedQty: true,
        totalPendingQty: true,

        isFullyDispatched: true,
        isFullyInvoiced: true,

        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage sales orders, execution progress, and conversion from
            quotations.
          </p>
        </div>

        <Link
          href="/dashboard/sales/orders/analytics"
          className={buttonVariants()}>
          Analytics <ArrowRight />
        </Link>
      </div>

      <OrderTable
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
