// lib/actions/dashboard/sales/orders/getSalesOrderByIdAction.ts
"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const getSalesOrderByIdAction = async (id: string) => {
  await requireAuth();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          city: true,
          state: true,
          gstin: true,
          companyPhone: true,
          companyEmail: true,
        },
      },
      quotation: {
        select: {
          id: true,
          quoteNo: true,
          quoteFy: true,
          status: true,
          createdAt: true,
        },
      },
      items: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variant: {
            select: {
              id: true,
              variant: true,
              sku: true,
              typeNumber: true,
              drawings: true,
            },
          },
          ComponentsOfProductInSalesOrder: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      poFile: true,
      deliveryChallans: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          challanNo: true,
          challanFy: true,
          createdAt: true,
        },
      },
      invoices: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          invoiceNo: true,
          invoiceFy: true,
          status: true,
          createdAt: true,
          grandTotal: true,
        },
      },
    },
  });

  if (!order) {
    return {
      ok: false as const,
      message: "Sales order not found",
    };
  }

  return {
    ok: true as const,
    order,
  };
};
