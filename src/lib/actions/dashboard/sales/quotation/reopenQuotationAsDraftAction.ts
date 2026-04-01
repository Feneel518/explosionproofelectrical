"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function reopenQuotationAsDraftAction(id: string) {
  const session = await requireAuth();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          ComponentsOfProductInQuotation: {
            include: {
              componentsOfQuotation: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!quotation) {
    return { ok: false as const, message: "Quotation not found" };
  }

  if (quotation.convertedToOrderAt) {
    return {
      ok: false as const,
      message: "Converted quotation cannot be edited",
    };
  }

  // const draftData = {
  //   header: {
  //     platform: quotation.platform,
  //     customerId: quotation.customerId,
  //     clientName: quotation.clientName,

  //     receivedFromName: quotation.receivedFromName,
  //     receivedFromPhone: quotation.receivedFromPhone,
  //     receivedFromEmail: quotation.receivedFromEmail,
  //     enquiryMessage: quotation.enquiryMessage,

  //     additionalNotes: quotation.additionalNotes,
  //     deliveryDate: quotation.deliveryDate
  //       ? new Date(quotation.deliveryDate).toISOString()
  //       : null,

  //     gst: quotation.gst,
  //     packingCharges: quotation.packingCharges,
  //     paymentTerms: quotation.paymentTerms,
  //     transportationPayment: quotation.transportationPayment,
  //     discount: quotation.discount,

  //     nextFollowupAt: quotation.nextFollowupAt
  //       ? quotation.nextFollowupAt.toISOString()
  //       : null,
  //   },
  //   items: quotation.items.map((item) => ({
  //     id: item.id,
  //     productId: item.productId,
  //     variantId: item.variantId,

  //     title: item.title,
  //     sku: item.sku,
  //     typeNumber: item.typeNumber,
  //     description: item.description,
  //     rating: item.rating,
  //     terminals: item.terminals,
  //     hardware: item.hardware,
  //     gasket: item.gasket,
  //     mounting: item.mounting,
  //     cableEntry: item.cableEntry,
  //     earthing: item.earthing,
  //     hsnCode: item.hsnCode,
  //     cutoutSize: item.cutoutSize,
  //     plateSize: item.plateSize,
  //     glass: item.glass,
  //     wireGuard: item.wireGuard,
  //     variantType: item.variantType,
  //     size: item.size,
  //     rpm: item.rpm,
  //     kW: item.kW,
  //     horsePower: item.horsePower,
  //     poReference: item.poReference,

  //     qty: item.qty,
  //     unit: item.unit,
  //     unitPrice: item.unitPrice.toString(),
  //     sortOrder: item.sortOrder,

  //     showVariantImages: item.showVariantImages,
  //     showVariantDrawings: item.showVariantDrawings,

  //     selectedVariantImageIds: item.selectedVariantImageIds,
  //     selectedVariantDrawingIds: item.selectedVariantDrawingIds,

  //     variantImagesSnapshot: item.variantImagesSnapshot,
  //     variantDrawingsSnapshot: item.variantDrawingsSnapshot,
  //     component: item.ComponentsOfProductInQuotation.map((join) => ({
  //       id: join.componentsOfQuotation.id,
  //       item: join.componentsOfQuotation.item,
  //       unit: join.componentsOfQuotation.unit,
  //     })),
  //   })),
  // };

  const abc = await prisma.quotation.update({
    where: { id },
    data: {
      status: "DRAFT",
      draftData: quotation.draftData as any,
      draftVersion: { increment: 1 },
      updatedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/sales/quotations");
  revalidatePath(`/dashboard/sales/quotations/${id}`);

  return {
    ok: true as const,
    message: "Quotation reopened for editing",
  };
}
