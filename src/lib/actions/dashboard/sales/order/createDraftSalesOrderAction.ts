"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const createDraftSalesOrderAction = async () => {
  const session = await requireAuth();

  const fy = getFinancialYearLabel();

  const last = await prisma.salesOrder.findFirst({
    where: { orderFy: fy },
    orderBy: { orderNo: "desc" },
    select: { orderNo: true },
  });

  const nextOrderNo = (last?.orderNo ?? 0) + 1;

  const defaultDraft = {
    header: {
      quotationId: null,

      customerId: null,
      clientName: null,

      clientNameSnapshot: null,
      citySnapshot: null,
      stateSnapshot: null,
      gstinSnapshot: null,

      sourceType: "DIRECT",

      poNumber: null,
      poDate: null,
      orderDate: new Date().toISOString(),

      receivedFromName: null,
      receivedFromPhone: null,
      receivedFromEmail: null,

      additionalNotes: null,
      deliveryDate: "4 weeks",

      gst: "CGST_SGST_18",
      packingCharges: "INCLUDED",
      paymentTerms: "ADVANCE",
      transportationPayment: "TO_PAY",
      discount: null,

      subtotal: 0,
      discountTotal: 0,
      taxableTotal: 0,
      gstTotal: 0,
      grandTotal: 0,

      totalItemsCount: 0,
      totalOrderedQty: 0,
      totalDispatchedQty: 0,
      totalInvoicedQty: 0,
      totalPendingQty: 0,

      isConvertedFromQuotation: false,
      isClosed: false,
      isFullyDispatched: false,
      isFullyInvoiced: false,
      isOverdueForDispatch: false,
    },
    items: [],
  };

  const created = await prisma.salesOrder.create({
    data: {
      orderFy: fy,
      orderNo: nextOrderNo,
      status: "DRAFT",
      sourceType: "DIRECT",

      gst: "CGST_SGST_18",
      packingCharges: "INCLUDED",
      paymentTerms: "ADVANCE",
      transportationPayment: "TO_PAY",

      orderDate: new Date(),

      createdById: session.user.id,
      updatedById: session.user.id,

      draftData: defaultDraft,
      draftVersion: 0,
    },
    select: {
      id: true,
    },
  });

  return { ok: true as const, id: created.id };
};
