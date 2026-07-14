"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { syncSalesOrderInvoiceProgress } from "@/lib/actions/dashboard/sales/order/syncSalesOrderInvoiceProgress";
import { revalidatePath } from "next/cache";

export async function reopenInvoiceAsDraftAction(invoiceId: string) {
  const session = await requireAuth();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true, salesOrderId: true },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    if (invoice.status !== "FINALIZED") {
      return {
        ok: false as const,
        message: "Only finalized invoices can be reopened",
      };
    }

    if (!invoice.salesOrderId) {
      return {
        ok: false as const,
        message: "Legacy invoice is not linked to a sales order",
      };
    }

    const salesOrderId = invoice.salesOrderId;

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "DRAFT",
        },
      });

      await syncSalesOrderInvoiceProgress(
        tx,
        salesOrderId,
        session.user.id,
      );
    });

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    revalidatePath(`/dashboard/sales/orders/${salesOrderId}`);

    return {
      ok: true as const,
      message: "Invoice reopened as draft",
    };
  } catch (error) {
    console.error("reopenInvoiceAsDraftAction", error);
    return {
      ok: false as const,
      message: "Failed to reopen invoice",
    };
  }
}
