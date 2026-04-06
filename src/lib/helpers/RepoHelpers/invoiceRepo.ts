import { InvoiceQP } from "@/lib/searchParams/dashboard/sales/invoice/InvoiceSearchParams";
import { Prisma } from "@prisma/client";

export function buildInvoiceWhere(sp: InvoiceQP): Prisma.InvoiceWhereInput {
  const and: Prisma.InvoiceWhereInput[] = [];

  if (sp.q) {
    and.push({
      OR: [
        { clientNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { gstinSnapshot: { contains: sp.q, mode: "insensitive" } },
        { poNumber: { contains: sp.q, mode: "insensitive" } },
        {
          customer: {
            companyName: { contains: sp.q, mode: "insensitive" },
          },
        },
        {
          salesOrder: {
            clientNameSnapshot: { contains: sp.q, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (sp.status !== "ALL") {
    and.push({ status: sp.status as any });
  }

  if (sp.customerId) {
    and.push({ customerId: sp.customerId });
  }

  if (sp.salesOrderId) {
    and.push({ salesOrderId: sp.salesOrderId });
  }

  if (sp.fy) {
    and.push({ invoiceFy: sp.fy });
  }

  if (sp.dateFrom || sp.dateTo) {
    const fromDate = sp.dateFrom ? new Date(sp.dateFrom) : undefined;
    const toDate = sp.dateTo ? new Date(sp.dateTo) : undefined;

    if (toDate && !Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
    }

    and.push({
      invoiceDate: {
        gte:
          fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
        lte: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
      },
    });
  }

  return and.length ? { AND: and } : {};
}

type InvoiceOrderBy =
  | Prisma.InvoiceOrderByWithRelationInput
  | Prisma.InvoiceOrderByWithRelationInput[];

export function buildInvoicesOrderBy(sp: InvoiceQP): InvoiceOrderBy {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "invoiceDate":
      return { invoiceDate: dir };

    case "invoiceNo":
      return [{ invoiceFy: dir }, { invoiceNo: dir }];

    case "grandTotal":
      return { grandTotal: dir };

    case "clientNameSnapshot":
      return { clientNameSnapshot: dir };

    case "status":
      return { status: dir };

    case "createdAt":
    default:
      return { createdAt: dir };
  }
}
