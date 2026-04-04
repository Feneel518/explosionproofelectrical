"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export type CustomerLastVariantPrice = {
  variantId: string;
  source: "INVOICE" | "SALES_ORDER";
  sourceId: string;
  sourceNo: string;
  sourceDate: string | null;
  unitPrice: number;
};

export type CustomerLastVariantPriceBySource = {
  variantId: string;
  lastInvoice: CustomerLastVariantPrice | null;
  lastSalesOrder: CustomerLastVariantPrice | null;
};

export async function getCustomerLastVariantPricesAction({
  customerId,
  variantIds,
}: {
  customerId: string;
  variantIds: string[];
}) {
  await requireAuth();

  if (!customerId) {
    return {
      ok: true as const,
      prices: [] as CustomerLastVariantPriceBySource[],
    };
  }

  const uniqueVariantIds = Array.from(new Set((variantIds ?? []).filter(Boolean)));
  if (uniqueVariantIds.length === 0) {
    return {
      ok: true as const,
      prices: [] as CustomerLastVariantPriceBySource[],
    };
  }

  const invoiceRows = await prisma.invoiceItem.findMany({
    where: {
      variantId: { in: uniqueVariantIds },
      invoice: {
        customerId,
        status: {
          in: ["DRAFT", "FINALIZED"],
        },
      },
    },
    select: {
      variantId: true,
      unitPrice: true,
      invoice: {
        select: {
          id: true,
          invoiceNo: true,
          invoiceFy: true,
          invoiceDate: true,
        },
      },
      createdAt: true,
    },
    orderBy: [{ invoice: { invoiceDate: "desc" } }, { createdAt: "desc" }],
    take: Math.max(20, uniqueVariantIds.length * 8),
  });

  const lastInvoiceByVariant = new Map<string, CustomerLastVariantPrice>();

  for (const row of invoiceRows) {
    if (!row.variantId || lastInvoiceByVariant.has(row.variantId)) continue;

    lastInvoiceByVariant.set(row.variantId, {
      variantId: row.variantId,
      unitPrice: Number(row.unitPrice || 0),
      source: "INVOICE",
      sourceId: row.invoice.id,
      sourceNo: `${row.invoice.invoiceFy}-${String(row.invoice.invoiceNo).padStart(3, "0")}`,
      sourceDate: row.invoice.invoiceDate
        ? row.invoice.invoiceDate.toISOString()
        : null,
    });
  }

  const salesOrderRows = await prisma.salesOrderItem.findMany({
    where: {
      variantId: { in: uniqueVariantIds },
      salesOrder: {
        customerId,
        status: {
          in: [
            "DRAFT",
            "CONFIRMED",
            "IN_PRODUCTION",
            "PARTIALLY_DISPATCHED",
            "DISPATCHED",
            "PARTIALLY_INVOICED",
            "INVOICED",
            "COMPLETED",
          ],
        },
      },
    },
    select: {
      variantId: true,
      unitPrice: true,
      salesOrder: {
        select: {
          id: true,
          orderNo: true,
          orderFy: true,
          orderDate: true,
        },
      },
      createdAt: true,
    },
    orderBy: [{ salesOrder: { orderDate: "desc" } }, { createdAt: "desc" }],
    take: Math.max(20, uniqueVariantIds.length * 8),
  });

  const lastSalesOrderByVariant = new Map<string, CustomerLastVariantPrice>();
  for (const row of salesOrderRows) {
    if (!row.variantId || lastSalesOrderByVariant.has(row.variantId)) continue;

    lastSalesOrderByVariant.set(row.variantId, {
      variantId: row.variantId,
      unitPrice: Number(row.unitPrice || 0),
      source: "SALES_ORDER",
      sourceId: row.salesOrder.id,
      sourceNo: `${row.salesOrder.orderFy}-${String(row.salesOrder.orderNo).padStart(3, "0")}`,
      sourceDate: row.salesOrder.orderDate
        ? row.salesOrder.orderDate.toISOString()
        : null,
    });
  }

  const prices: CustomerLastVariantPriceBySource[] = uniqueVariantIds.map((variantId) => ({
    variantId,
    lastInvoice: lastInvoiceByVariant.get(variantId) ?? null,
    lastSalesOrder: lastSalesOrderByVariant.get(variantId) ?? null,
  }));

  return {
    ok: true as const,
    prices,
  };
}
