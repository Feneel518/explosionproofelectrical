"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import { QuotationDraftData } from "@/lib/types/QuotationType";
import { revalidatePath } from "next/cache";

export const createDraftQuotationAction = async () => {
  const session = await requireAuth();

  const fy = getFinancialYearLabel(new Date());

  const counter = await prisma.fiscalCounter.upsert({
    where: {
      key: `EXQN-${fy}`,
    },
    create: {
      key: `EXQN-${fy}`,
      value: 1,
    },
    update: {
      value: {
        increment: 1,
      },
    },
  });

  const emptyDraft: QuotationDraftData = {
    header: {},
    items: [],
  };

  const quoateNo = `EXQN-${fy}-${counter.value}`;

  const draft = await prisma.quotation.create({
    data: {
      quoteFy: fy,
      quoteNo: counter.value,
      status: "DRAFT",
      createdById: session.user.id,
      updatedById: session.user.id,
      gst: "CGST_SGST_18",
      draftData: emptyDraft,
      draftVersion: 0,
    },
    select: {
      id: true,
      quoteNo: true,
      quoteFy: true,
    },
  });

  return { ok: true, message: "Draft quotation created", id: draft.id };
};
