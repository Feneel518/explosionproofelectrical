"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { Prisma } from "@prisma/client";

export type InvoiceableOrderSearchItem = {
  id: string;
  orderNo: number;
  orderFy: string;
  orderDate: string | null;
  poNumber: string | null;
  clientNameSnapshot: string | null;
  customerName: string | null;
  totalPendingQty: number;
  grandTotal: number;
};

export async function searchInvoiceableOrdersForSelectAction({
  query,
  cursor,
  take = 20,
}: {
  query?: string;
  cursor?: string | null;
  take?: number;
}) {
  await requireAuth();

  const q = (query ?? "").trim();

  const where: Prisma.SalesOrderWhereInput = {
    deletedAt: null,
    status: {
      notIn: ["CANCELLED", "COMPLETED"],
    },

    items: {
      some: {},
    },
    ...(q
      ? {
          OR: [
            { clientNameSnapshot: { contains: q, mode: "insensitive" } },
            { clientName: { contains: q, mode: "insensitive" } },
            { poNumber: { contains: q, mode: "insensitive" } },
            {
              customer: {
                companyName: { contains: q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const rows = await prisma.salesOrder.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    select: {
      id: true,
      orderNo: true,
      orderFy: true,
      orderDate: true,
      poNumber: true,
      clientNameSnapshot: true,
      clientName: true,
      totalPendingQty: true,
      grandTotal: true,
      customer: {
        select: {
          companyName: true,
        },
      },
      items: {
        select: {
          qty: true,
          invoicedQty: true,
        },
      },
    },
  });

  const filtered = rows
    .filter((row) =>
      row.items.some((item) => Number(item.qty) > Number(item.invoicedQty)),
    )
    .slice(0, take);

  const nextCursor = rows.length > take ? (rows[take - 1]?.id ?? null) : null;

  const items: InvoiceableOrderSearchItem[] = filtered.map((row) => ({
    id: row.id,
    orderNo: row.orderNo,
    orderFy: row.orderFy,
    orderDate: row.orderDate ? row.orderDate.toISOString() : null,
    poNumber: row.poNumber ?? null,
    clientNameSnapshot: row.clientNameSnapshot ?? row.clientName ?? null,
    customerName: row.customer?.companyName ?? null,
    totalPendingQty: Number(row.totalPendingQty ?? 0),
    grandTotal: Number(row.grandTotal ?? 0),
  }));

  return {
    items,
    nextCursor,
  };
}
