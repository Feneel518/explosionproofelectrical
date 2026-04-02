import DeliveryChallanTable from "@/components/dashboard/sales/delivery-challan/DeliveryChallanTable";
import { buttonVariants } from "@/components/ui/button";
import {
  buildDeliveryChallansOrderBy,
  buildDeliveryChallanWhere,
} from "@/lib/helpers/RepoHelpers/DeliveryChallanRepoHelpers";

import { prisma } from "@/lib/prisma/db";
import { deliveryChallanSearchParamsCache } from "@/lib/searchParams/dashboard/sales/delivery-challan/DeliveryChallanSearchParams";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<PageProps> = async ({ searchParams }) => {
  const sp = deliveryChallanSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildDeliveryChallanWhere(sp);
  const orderBy = buildDeliveryChallansOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.deliveryChallan.findMany({
      where,
      orderBy,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        challanNo: true,
        challanFy: true,
        challanCode: true,

        type: true,
        status: true,
        partyType: true,

        date: true,
        issuedAt: true,
        closedAt: true,
        expectedReturnDate: true,

        poNumber: true,
        remarks: true,

        quotationId: true,
        quotation: {
          select: {
            id: true,
            quoteNo: true,
            quoteFy: true,
            clientName: true,
          },
        },

        customerId: true,
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },

        items: {
          select: {
            id: true,
            qty: true,
            pendingQty: true,
            closedQty: true,
            title: true,
          },
        },

        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.deliveryChallan.count({ where }),
  ]);

  const safeItems = serializeForClient(items);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Delivery Challans
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage dispatch challans, job work challans, samples, and returnable
            challans.
          </p>
        </div>

        <Link
          href="/dashboard/sales/delivery-challans/analytics"
          className={buttonVariants()}>
          Analytics
          <ArrowRight className="" />
        </Link>
      </div>

      <DeliveryChallanTable
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
