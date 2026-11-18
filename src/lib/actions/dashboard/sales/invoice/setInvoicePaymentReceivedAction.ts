"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";

export async function setInvoicePaymentReceivedAction(
  invoiceId: string,
  received: boolean,
) {
  await requirePermission("accounts.write");

  try {
    z.object({ invoiceId: z.uuid(), received: z.boolean() }).parse({ invoiceId, received });
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    if (invoice.status !== "FINALIZED") {
      return {
        ok: false as const,
        message: "Only finalized invoices can have a payment recorded",
      };
    }

    await prisma.invoice.update({
      where: { id: invoiceId, status: "FINALIZED" },
      data: {
        paymentReceived: received,
        paymentReceivedAt: received ? new Date() : null,
      },
    });

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);

    return {
      ok: true as const,
      message: received
        ? "Payment marked as received"
        : "Payment marked as pending",
    };
  } catch (error) {
    console.error("setInvoicePaymentReceivedAction", error);
    return {
      ok: false as const,
      message: "Failed to update payment status",
    };
  }
}
