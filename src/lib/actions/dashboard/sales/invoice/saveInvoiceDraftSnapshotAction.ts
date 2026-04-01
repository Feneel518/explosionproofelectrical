"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { InvoiceDraftData } from "@/lib/types/Invoicetable";

export const saveInvoiceDraftSnapshotAction = async ({
  invoiceId,
  draft,
  clientVersion,
}: {
  invoiceId: string;
  draft: InvoiceDraftData;
  clientVersion: number;
}) => {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, draftVersion: true },
  });

  if (!invoice) return { ok: false as const, message: "Invoice not found" };

  if (invoice.status !== "DRAFT") {
    return { ok: false as const, message: "Cannot autosave non-draft invoice" };
  }

  if (clientVersion !== invoice.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: invoice.draftVersion,
    };
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      draftData: draft,
      draftVersion: { increment: 1 },
    },
    select: {
      draftVersion: true,
      updatedAt: true,
    },
  });

  return {
    ok: true as const,
    serverVersion: updated.draftVersion,
    savedAt: updated.updatedAt.toISOString(),
  };
};
