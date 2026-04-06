"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export type GrnDraftData = {
  header: {
    receivedAt?: string | null;
    supplierId?: string | null;
    supplierName?: string | null;
    supplierInvoiceNo?: string | null;
    supplierInvoiceDate?: string | null;
    supplierInvoiceFiles?: Array<{
      kind?: string | null;
      url: string;
      title?: string | null;
    }>;
    transporterName?: string | null;
    lrNumber?: string | null;
    transportationPaid?: boolean;
    transportationPaidAmount?: number | null;
    remarks?: string | null;
  };
  items: Array<{
    id: string;
    rawMaterialId: string | null;
    title: string;
    supplierItemName?: string | null;
    sku?: string | null;
    typeNumber?: string | null;
    hsnCode?: string | null;
    unit?: string | null;
    qty: number;
    unitCost: number;
    discountPercent: number;
    grossAmount: number;
    discountAmount: number;
    effectiveUnitCost: number;
    lineTotal: number;
    sortOrder: number;
  }>;
};

export async function createDraftGrnAction() {
  const session = await requireAuth();
  const fy = getFinancialYearLabel(new Date());

  const counter = await prisma.fiscalCounter.upsert({
    where: { key: `GRN:${fy}` },
    create: { key: `GRN:${fy}`, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });

  const emptyDraft: GrnDraftData = {
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
  };

  const created = await prisma.goodsReceiptNote.create({
    data: {
      grnNo: counter.value,
      grnFy: fy,
      status: "DRAFT",
      draftData: emptyDraft,
      draftVersion: 0,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true },
  });

  return { ok: true as const, id: created.id };
}
