import PendingOrdersBoard from "@/components/dashboard/sales/order/PendingOrdersBoard";
import { prisma } from "@/lib/prisma/db";
import { SalesOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function getClientName(row: {
  customer: { companyName: string } | null;
  clientNameSnapshot: string | null;
  clientName: string | null;
}) {
  return (
    row.customer?.companyName ||
    row.clientNameSnapshot ||
    row.clientName ||
    "Unknown Client"
  );
}

export default async function Page() {
  const orders = await prisma.salesOrder.findMany({
    where: {
      deletedAt: null,
      totalPendingQty: { gt: 0 },
      status: {
        notIn: [SalesOrderStatus.CANCELLED, SalesOrderStatus.COMPLETED],
      },
    },
    orderBy: [{ orderDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      orderNo: true,
      orderFy: true,
      orderDate: true,
      deliveryDate: true,
      status: true,
      totalPendingQty: true,
      clientName: true,
      clientNameSnapshot: true,
      customer: {
        select: {
          companyName: true,
        },
      },
      items: {
        where: {
          pendingQty: { gt: 0 },
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          title: true,
          pendingQty: true,
          qty: true,
          dispatchedQty: true,
          invoicedQty: true,
          product: {
            select: {
              name: true,
            },
          },
          variant: {
            select: {
              variant: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    take: 1000,
  });

  const normalized = orders.map((row) => ({
    id: row.id,
    orderNo: row.orderNo,
    orderFy: row.orderFy,
    orderDate: row.orderDate ? row.orderDate.toISOString() : null,
    deliveryDate: row.deliveryDate,
    status: row.status,
    clientName: getClientName(row),
    totalPendingQty: row.totalPendingQty,
    items: row.items.map((item) => {
      const productName =
        item.product?.name || item.variant?.product?.name || item.title;
      const variantLabel = item.variant?.variant || "";

      return {
        id: item.id,
        title: item.title,
        productLabel: variantLabel ? `${productName} - ${variantLabel}` : productName,
        pendingQty: item.pendingQty,
        orderedQty: item.qty,
        dispatchedQty: item.dispatchedQty,
        invoicedQty: item.invoicedQty,
      };
    }),
  }));

  return <PendingOrdersBoard generatedAt={new Date().toISOString()} orders={normalized} />;
}

