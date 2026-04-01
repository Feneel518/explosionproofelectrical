"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import {
  formatPrefixedFinancialDocumentNumber,
  getFinancialYearLabel,
} from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export type DeliveryChallanDraftData = {
  header: {
    type?: "TO_BE_BILLED" | "JOB_WORK" | "SAMPLE" | "RETURNABLE";
    partyType?: "CUSTOMER" | "VENDOR" | "OTHER";
    poNumber?: string | null;
    quotationId?: string | null;
    customerId?: string | null;
    date?: Date | null;
    expectedReturnDate?: Date | null;
    expectedClosureDate?: Date | null;
    transporterName?: string | null;
    vehicleNumber?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    dispatchThrough?: string | null;
    lrNumber?: string | null;
    numberOfPackages?: number | null;
    remarks?: string | null;
  };
  items: Array<{
    kind: "PRODUCT" | "RAW_MATERIAL";
    productId?: string | null;
    id?: string | null;
    title: string;
    sku?: string | null;
    typeNumber?: string | null;
    description?: string | null;
    hsnCode?: string | null;
    unit?: string | null;
    qty: number | string;
    closedQty: number | string;
    pendingQty: number | string;
    sortOrder: number;
  }>;
};

export const createDraftDeliveryChallanAction = async () => {
  const session = await requireAuth();

  const fy = getFinancialYearLabel(new Date());

  const counter = await prisma.fiscalCounter.upsert({
    where: {
      key: `EXDC-${fy}`,
    },
    create: {
      key: `EXDC-${fy}`,
      value: 1,
    },
    update: {
      value: {
        increment: 1,
      },
    },
  });

  const emptyDraft: DeliveryChallanDraftData = {
    header: {
      type: "TO_BE_BILLED",
      partyType: "CUSTOMER",
      date: new Date(),
    },
    items: [],
  };

  const challanCode = formatPrefixedFinancialDocumentNumber(
    "EXDC-",
    fy,
    counter.value,
  );

  const draft = await prisma.deliveryChallan.create({
    data: {
      challanFy: fy,
      challanNo: counter.value,
      challanCode,
      status: "DRAFT",
      type: "TO_BE_BILLED",
      partyType: "CUSTOMER",
      createdById: session.user.id,
      updatedById: session.user.id,
      draftData: emptyDraft,
      draftVersion: 0,
    },
    select: {
      id: true,
      challanNo: true,
      challanFy: true,
      challanCode: true,
    },
  });

  return {
    ok: true as const,
    message: "Draft delivery challan created",
    id: draft.id,
  };
};
