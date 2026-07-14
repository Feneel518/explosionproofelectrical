"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function setInvoicePaymentReceivedAction(
  invoiceId: string,
  received: boolean,
) {
  await requireAuth();

  try {
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

    if (invoice.status === "CANCELLED") {
      return {
        ok: false as const,
        message: "Cancelled invoice cannot be updated",
      };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
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
