"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";
import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";
import {
  refreshSalesOrderInvoiceProgress,
  rollbackInvoiceEffects,
} from "./invoiceSettlement";

export async function reopenInvoiceAsDraftAction(invoiceId: string) {
  const session = await requireAuth();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          select: {
            id: true,
            status: true,
            salesOrderId: true,
          },
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

        await rollbackInvoiceEffects(tx, {
          invoiceId,
          salesOrderId: invoice.salesOrderId ?? null,
        });

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "DRAFT",
          },
        });

        if (invoice.salesOrderId) {
          await refreshSalesOrderInvoiceProgress(tx, {
            salesOrderId: invoice.salesOrderId,
            updatedById: session.user.id,
          });
        }

        return {
          ok: true as const,
          message: "Invoice reopened as draft",
          salesOrderId: invoice.salesOrderId ?? null,
        };
      },
      INVOICE_TRANSACTION_OPTIONS,
    );

    if (!result.ok) {
      return result;
    }

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}/edit`);
    if (result.salesOrderId) {
      revalidatePath(`/dashboard/sales/orders/${result.salesOrderId}`);
    }
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");

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
