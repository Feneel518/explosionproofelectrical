"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function reopenInvoiceAsDraftAction(invoiceId: string) {
  await requireAuth();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true },
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

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "DRAFT",
      },
    });

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
