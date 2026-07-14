import { OrderQP } from "@/lib/searchParams/dashboard/sales/order/OrderSearchParams";
import { Prisma } from "@prisma/client";

export function buildSalesOrderWhere(sp: OrderQP): Prisma.SalesOrderWhereInput {
  const and: Prisma.SalesOrderWhereInput[] = [];

  if (sp.q) {
    and.push({
      OR: [
        { clientName: { contains: sp.q, mode: "insensitive" } },
        { clientNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { poNumber: { contains: sp.q, mode: "insensitive" } },
        { receivedFromName: { contains: sp.q, mode: "insensitive" } },
        { receivedFromPhone: { contains: sp.q, mode: "insensitive" } },
        { receivedFromEmail: { contains: sp.q, mode: "insensitive" } },
        {
          customer: {
            companyName: { contains: sp.q, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (sp.status !== "ALL") {
    and.push({ status: sp.status as any });
  }

  if (sp.sourceType !== "ALL") {
    and.push({ sourceType: sp.sourceType as any });
  }

  if (sp.customerId) {
    and.push({ customerId: sp.customerId });
  }

  if (sp.quotationId) {
    and.push({ quotationId: sp.quotationId });
  }

  if (sp.fy) {
    and.push({ orderFy: sp.fy });
  }

  if (sp.dateFrom || sp.dateTo) {
    const fromDate = sp.dateFrom ? new Date(sp.dateFrom) : undefined;
    const toDate = sp.dateTo ? new Date(sp.dateTo) : undefined;

    if (toDate && !Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
    }

    and.push({
      orderDate: {
        gte:
          fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
        lte: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
      },
    });
  }

  if (sp.trash === "EXCLUDE") {
    and.push({ deletedAt: null });
  } else if (sp.trash === "ONLY") {
    and.push({ NOT: { deletedAt: null } });
  }

  return and.length ? { AND: and } : {};
}

type SalesOrderOrderBy =
  | Prisma.SalesOrderOrderByWithRelationInput
  | Prisma.SalesOrderOrderByWithRelationInput[];

export function buildSalesOrdersOrderBy(sp: OrderQP): SalesOrderOrderBy {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "orderDate":
      return { orderDate: dir };

    case "orderNo":
      return [{ orderFy: dir }, { orderNo: dir }];

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
