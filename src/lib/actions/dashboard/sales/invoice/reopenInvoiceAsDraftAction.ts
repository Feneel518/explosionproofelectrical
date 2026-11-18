"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";
import { INVOICE_TRANSACTION_OPTIONS } from "./transactionOptions";
import {
  refreshSalesOrderInvoiceProgress,
  rollbackInvoiceEffects,
} from "./invoiceSettlement";

export async function reopenInvoiceAsDraftAction(invoiceId: string) {
  const session = await requirePermission("accounts.write");

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.update({
          where: { id: invoiceId, status: "FINALIZED" },
          data: { draftVersion: { increment: 1 } },
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

        await tx.invoicePackageItem.deleteMany({
          where: {
            invoicePackage: {
              invoiceId,
            },
          },
        });
        await tx.invoicePackage.deleteMany({ where: { invoiceId } });
        await tx.productMedia.deleteMany({
          where: {
            invoiceItem: {
              invoiceId,
            },
          },
        });
        await tx.productSerial.updateMany({
          where: { invoiceItem: { invoiceId } },
          data: {
            status: "AVAILABLE",
            invoiceItemId: null,
            invoicedAt: null,
          },
        });
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });

        await tx.invoice.update({
          where: { id: invoiceId, status: "FINALIZED" },
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
    revalidatePath("/dashboard/serial");

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
