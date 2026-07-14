"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export type MaterialIssueDraftData = {
  header: {
    issueDate?: string | null;
    issueType?: "INTERNAL_USE" | "DIRECT_SALE";
    issuedToName?: string | null;
    issuedByName?: string | null;
    directSaleCustomerName?: string | null;
    directSaleReferenceNo?: string | null;
    department?: string | null;
    purpose?: string | null;
    workReference?: string | null;
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
    qtyIssued: number;
    sortOrder: number;
  }>;
};

export async function createDraftMaterialIssueAction() {
  const session = await requireAuth();
  const fy = getFinancialYearLabel(new Date());

  const counter = await prisma.fiscalCounter.upsert({
    where: { key: `MATERIAL_ISSUE:${fy}` },
    create: { key: `MATERIAL_ISSUE:${fy}`, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });

  const emptyDraft: MaterialIssueDraftData = {
    header: {
      issueDate: new Date().toISOString(),
      issueType: "INTERNAL_USE",
      issuedToName: "",
      issuedByName: "",
      directSaleCustomerName: "",
      directSaleReferenceNo: "",
      department: "",
      purpose: "",
      workReference: "",
      remarks: "",
    },
    items: [],
  };

  const created = await prisma.materialIssue.create({
    data: {
      issueNo: counter.value,
      issueFy: fy,
      status: "DRAFT",
      issuedToNameSnapshot: "Draft",
      draftData: emptyDraft,
      draftVersion: 0,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
    select: { id: true },
  });

  return { ok: true as const, id: created.id };
}
