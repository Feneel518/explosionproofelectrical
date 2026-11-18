"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export const getInvoiceDraftAction = async (id: string) => {
  await requirePermission("accounts.read");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      invoiceNo: true,
      invoiceFy: true,
      draftData: true,
      draftVersion: true,
      salesOrderId: true,
      salesOrderVersionSnapshot: true,
      salesOrder: {
        select: {
          id: true,
          orderNo: true,
          orderFy: true,
          orderVersion: true,
          status: true,
        },
      },
    },
  });

  if (!invoice) {
    return { ok: false as const, message: "Invoice not found" };
  }

  if (invoice.status !== "DRAFT") {
    return { ok: false as const, message: "Invoice is not editable" };
  }

  return {
    ok: true as const,
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    invoiceFy: invoice.invoiceFy,
    salesOrderId: invoice.salesOrderId,
    draft: invoice.draftData,
    draftVersion: invoice.draftVersion,
    salesOrderVersionSnapshot: invoice.salesOrderVersionSnapshot,
    liveOrderVersion: invoice.salesOrder?.orderVersion ?? null,
  };
};
