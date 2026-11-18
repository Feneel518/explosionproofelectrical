"use server";
import { normalizeInvoiceDraft } from "@/lib/invoices/draft";
import { saveVersionedDraft } from "@/lib/prisma/saveVersionedDraft";

import { requirePermission } from "@/lib/check/permissions";
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
  const session = await requirePermission("accounts.write");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, draftVersion: true, gstMode: true, salesOrder: { select: { gst: true } } },
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


  return saveVersionedDraft(
    () => prisma.invoice.update({
    where: { id: invoiceId, status: "DRAFT", draftVersion: clientVersion },
    data: {
      draftData: normalizeInvoiceDraft(draft, invoice.salesOrder?.gst ?? invoice.gstMode),
      draftVersion: { increment: 1 },
    },
    select: {
      draftVersion: true,
      updatedAt: true,
    },
  }),
    () => prisma.invoice.findUnique({ where: { id: invoiceId }, select: { draftVersion: true } }),
  );
};
