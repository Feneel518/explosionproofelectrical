import { prisma } from "@/lib/prisma/db";
import { FC } from "react";
import { invoiceSearchParamsCache } from "@/lib/searchParams/dashboard/sales/invoice/InvoiceSearchParams";
import {
  buildInvoicesOrderBy,
  buildInvoiceWhere,
} from "@/lib/helpers/RepoHelpers/invoiceRepo";
import InvoiceTable from "@/components/dashboard/sales/invoice/InvoiceTable";
import { invoiceListSelect } from "@/lib/types/Invoicetable";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const page: FC<PageProps> = async ({ searchParams }) => {
  const sp = invoiceSearchParamsCache.parse(await searchParams);

  const pageParams = Math.max(1, sp.page);
  const pageSizeParams = Math.min(50, Math.max(5, sp.pageSize));

  const where = buildInvoiceWhere(sp);
  const orderBy = buildInvoicesOrderBy(sp);

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: orderBy as any,
      skip: (pageParams - 1) * pageSizeParams,
      take: pageSizeParams,
      select: invoiceListSelect,
    }),
    prisma.invoice.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage draft, finalized, and cancelled invoices linked to orders.
          </p>
        </div>
      </div>

      <InvoiceTable
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
