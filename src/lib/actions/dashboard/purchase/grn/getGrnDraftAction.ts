"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { GrnDraftData } from "./createDraftGrnAction";

export async function getGrnDraftAction(id: string) {
  await requireAuth();

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      grnNo: true,
      grnFy: true,
      draftData: true,
      draftVersion: true,
    },
  });

  if (!grn) {
    return { ok: false as const, message: "GRN not found." };
  }

  if (grn.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "GRN is finalized. Draft can no longer be edited.",
    };
  }

  const draft = (grn.draftData ?? {
    header: {
      receivedAt: new Date().toISOString(),
      supplierId: null,
      supplierName: "",
      supplierInvoiceNo: "",
      supplierInvoiceDate: "",
      supplierInvoiceFiles: [],
      transporterName: "",
      lrNumber: "",
      transportationPaid: false,
      transportationPaidAmount: null,
      remarks: "",
    },
    items: [],
  }) as GrnDraftData;

  return {
    ok: true as const,
    grnId: grn.id,
    grnNo: grn.grnNo,
    grnFy: grn.grnFy,
    draft,
    draftVersion: grn.draftVersion,
  };
}
