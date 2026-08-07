// lib/actions/dashboard/sales/orders/getPendingQuotationsForCustomerAction.ts
"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import { QuotationStatus } from "@prisma/client";

export const getPendingQuotationsForCustomerAction = async (
  customerId: string,
) => {
  await requireAuth();

  if (!customerId) {
    return {
      ok: true as const,
      items: [],
    };
  }

  const allowedStatuses: QuotationStatus[] = ["SENT", "FOLLOWUP"];

  const quotations = await prisma.quotation.findMany({
    where: {
      customerId,
      deletedAt: null,
      convertedToOrderAt: null,
      status: {
        in: allowedStatuses,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      quoteNo: true,
      quoteFy: true,
      status: true,
      clientName: true,
      receivedFromName: true,
      createdAt: true,
      draftData: true,
      additionalNotes: true,
      deliveryDate: true,
      gst: true,
      packingCharges: true,
      paymentTerms: true,
      transportationPayment: true,
      discount: true,
      customerId: true,
      customer: {
        select: {
          companyName: true,
          companyPhone: true,
          companyEmail: true,
          city: true,
          state: true,
          gstin: true,
        },
      },
      items: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          productId: true,
          variantId: true,
          title: true,
          sku: true,
          typeNumber: true,
          description: true,
          rating: true,
          terminals: true,
          hardware: true,
          gasket: true,
          mounting: true,
          cableEntry: true,
          earthing: true,
          hsnCode: true,
          cutoutSize: true,
          plateSize: true,
          glass: true,
          wireGuard: true,
          variantType: true,
          size: true,
          rpm: true,
          kW: true,
          horsePower: true,
          poReference: true,
          showVariantImages: true,
          showVariantDrawings: true,
          selectedVariantImageIds: true,
          selectedVariantDrawingIds: true,
          variantImagesSnapshot: true,
          variantDrawingsSnapshot: true,
          qty: true,
          unit: true,
          unitPrice: true,
          sortOrder: true,
          ComponentsOfProductInQuotation: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              componentsOfQuotation: {
                select: {
                  id: true,
                  item: true,
                  unit: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return {
    ok: true as const,
    items: quotations.map((q) => ({
      id: q.id,
      label: formatFinancialDocumentNumber(q.quoteFy, q.quoteNo),
      quoteNo: q.quoteNo,
      quoteFy: q.quoteFy,
      status: q.status,
      clientName: q.clientName,
      receivedFromName: q.receivedFromName,
      createdAt: q.createdAt.toISOString(),
      quotation: q,
    })),
  };
};
