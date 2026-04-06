import QuotationTable from "@/components/dashboard/sales/quotation/QuotationTable";
import { buttonVariants } from "@/components/ui/button";
import {
  buildQuotationsOrderBy,
  buildQuotationWhere,
} from "@/lib/helpers/RepoHelpers/QuotationRepo";
import { prisma } from "@/lib/prisma/db";
import { quotationSearchParamsCache } from "@/lib/searchParams/dashboard/sales/quotation/QuotationSearchParams";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import { serializeForClient } from "@/lib/helpers/server/serializeForClient";

interface pageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = quotationSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildQuotationWhere(sp);
  const orderBy = buildQuotationsOrderBy(sp);

  const [items, total, categories] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: {
        id: true,
        quoteNo: true,
        quoteFy: true,

        status: true,
        platform: true,

        receivedFromName: true,
        receivedFromPhone: true,
        receivedFromEmail: true,

        draftData: true,
        clientName: true,

        customerId: true,
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },

        nextFollowupAt: true,
        lastFollowupAt: true,

        convertedToOrderAt: true,

        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.quotation.count({ where }),
    prisma.category.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const safeItems = serializeForClient(items);
  const safeCategories = serializeForClient(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Manage quotation leads, follow-ups, and conversion to orders.
          </p>
        </div>

        <Link
          href={"/dashboard/sales/quotations/analytics"}
          className={buttonVariants()}>
          Analytics <ArrowRight></ArrowRight>
        </Link>
      </div>

      <QuotationTable
        items={safeItems}
        total={total}
        page={pageParams}
        pageSize={pageSizeParams}
        qp={sp}
        categories={safeCategories}
      />
    </div>
  );
};

export default page;
