"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { InvoiceableOrderSearchItem } from "./searchInvoiceableOrdersForSelectAction";

export async function getInvoiceableOrderForSelectById(
  id: string,
): Promise<InvoiceableOrderSearchItem | null> {
  await requireAuth();

  const row = await prisma.salesOrder.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      status: true,
      isFullyInvoiced: true,
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

  if (!row) return null;
  if (row.deletedAt) return null;
  if (row.status === "CANCELLED") return null;
  if (row.isFullyInvoiced) return null;

  const hasPending = row.items.some(
    (item) => Number(item.qty) > Number(item.invoicedQty),
  );

  if (!hasPending) return null;

  return {
    id: row.id,
    orderNo: row.orderNo,
    orderFy: row.orderFy,
    orderDate: row.orderDate ? row.orderDate.toISOString() : null,
    poNumber: row.poNumber ?? null,
    clientNameSnapshot: row.clientNameSnapshot ?? row.clientName ?? null,
    customerName: row.customer?.companyName ?? null,
    totalPendingQty: Number(row.totalPendingQty ?? 0),
    grandTotal: Number(row.grandTotal ?? 0),
  };
}
