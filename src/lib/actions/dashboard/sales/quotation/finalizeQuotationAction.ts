"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { QuotationDraftData } from "@/lib/types/QuotationType";
import { revalidatePath } from "next/cache";

function toDateOrNull(value?: string | Date | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export const finalizeQuotationAction = async (id: string) => {
  const session = await requireAuth();

  try {
    const q = await prisma.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        draftData: true,
        quoteNo: true,
        quoteFy: true,
        createdById: true,
      },
    });

    if (!q) {
      return { ok: false as const, message: "Quotation Not Found." };
    }

    if (q.status !== "DRAFT") {
      return { ok: false as const, message: "Quotation already finalized" };
    }

    const draft = q.draftData as QuotationDraftData | null;

    if (!draft) {
      return { ok: false as const, message: "No draft data found" };
    }

    if (!draft.items?.length) {
      return { ok: false as const, message: "Add at least one item" };
    }

    const invalidItem = draft.items.find(
      (it) =>
        !it.title?.trim() ||
        toNumber(it.qty) <= 0 ||
        toNumber(it.unitPrice, -1) < 0,
    );

    if (invalidItem) {
      return {
        ok: false as const,
        message: "Each item must have title, qty > 0 and valid unit price",
      };
    }

    const nextFollowupAt = toDateOrNull((draft.header as any)?.nextFollowupAt);

    // Prepare quotation update data OUTSIDE transaction
    const quotationUpdateData = {
      status: "SENT" as const,
      quoteNo: q.quoteNo,
      quoteFy: q.quoteFy,

      platform: draft.header?.platform ?? "OTHER",

      customerId: draft.header?.customerId ?? null,
      clientName: draft.header?.clientName ?? null,

      receivedFromName: draft.header?.receivedFromName ?? null,
      receivedFromPhone: draft.header?.receivedFromPhone ?? null,
      receivedFromEmail: draft.header?.receivedFromEmail ?? null,
      enquiryMessage: draft.header?.enquiryMessage ?? null,

      additionalNotes: draft.header?.additionalNotes ?? null,
      deliveryDate: draft.header?.deliveryDate ?? null,

      gst: draft.header?.gst ?? "CGST_SGST_18",
      packingCharges: draft.header?.packingCharges ?? null,
      paymentTerms: draft.header?.paymentTerms ?? null,
      transportationPayment: draft.header?.transportationPayment ?? null,
      discount: draft.header?.discount ?? null,
      nextFollowupAt,

      updatedById: session.user.id,
    };

    // Normalize items OUTSIDE transaction
    const preparedItems = draft.items.map((it, index) => ({
      id: it.id,
      quotationId: id,

      productId: it.productId ?? null,
      variantId: it.variantId ?? null,

      title: it.title?.trim() ?? "",
      sku: it.sku ?? null,
      typeNumber: it.typeNumber ?? null,
      description: it.description ?? null,
      rating: it.rating ?? null,
      terminals: it.terminals ?? null,
      hardware: it.hardware ?? null,
      gasket: it.gasket ?? null,
      mounting: it.mounting ?? null,
      cableEntry: it.cableEntry ?? null,
      earthing: it.earthing ?? null,
      hsnCode: it.hsnCode ?? null,
      cutoutSize: it.cutoutSize ?? null,
      plateSize: it.plateSize ?? null,
      glass: it.glass ?? null,
      wireGuard: it.wireGuard ?? null,
      variantType: it.variantType ?? null,
      size: it.size ?? null,
      rpm: it.rpm ?? null,
      kW: it.kW ?? null,
      horsePower: it.horsePower ?? null,
      poReference: it.poReference ?? null,

      showVariantImages: Boolean(it.showVariantImages),
      showVariantDrawings: Boolean(it.showVariantDrawings),

      selectedVariantImageIds: it.selectedVariantImageIds ?? [],
      selectedVariantDrawingIds: it.selectedVariantDrawingIds ?? [],

      variantImagesSnapshot: it.variantImagesSnapshot ?? [],
      variantDrawingsSnapshot: it.variantDrawingsSnapshot ?? [],

      qty: toNumber(it.qty, 0),
      unit: it.unit ?? null,
      unitPrice: toNumber(it.unitPrice, 0),
      sortOrder: toNumber(it.sortOrder, index),

      components:
        it.component?.map((comp) => ({
          item: comp.item?.trim() ?? "",
          unit: comp.unit ?? null,
        })) ?? [],
    }));

    await prisma.$transaction(
      async (tx) => {
        // 1) update quotation
        await tx.quotation.update({
          where: { id },
          data: quotationUpdateData,
        });

        // 2) fetch existing item ids
        const existingItems = await tx.quotationItem.findMany({
          where: { quotationId: id },
          select: { id: true },
        });

        const existingItemIds = existingItems.map((item) => item.id);

        // 3) delete old linked data in correct order
        if (existingItemIds.length > 0) {
          const existingJoins =
            await tx.componentsOfProductInQuotation.findMany({
              where: {
                productInQuotationId: { in: existingItemIds },
              },
              select: {
                id: true,
                componentsOfQuotationId: true,
              },
            });

          const componentIds = existingJoins
            .map((j) => j.componentsOfQuotationId)
            .filter(Boolean);

          await tx.componentsOfProductInQuotation.deleteMany({
            where: {
              productInQuotationId: { in: existingItemIds },
            },
          });

          if (componentIds.length > 0) {
            await tx.componentsOfQuotation.deleteMany({
              where: {
                id: { in: componentIds },
              },
            });
          }

          await tx.quotationItem.deleteMany({
            where: {
              id: { in: existingItemIds },
            },
          });
        }

        // 4) recreate items
        // If nested relations are needed, we still create item-by-item,
        // but we reduced all preparation work outside the tx.
        for (const item of preparedItems) {
          await tx.quotationItem.create({
            data: {
              id: item.id,
              quotationId: item.quotationId,

              productId: item.productId,
              variantId: item.variantId,

              title: item.title,
              sku: item.sku,
              typeNumber: item.typeNumber,
              description: item.description,
              rating: item.rating,
              terminals: item.terminals,
              hardware: item.hardware,
              gasket: item.gasket,
              mounting: item.mounting,
              cableEntry: item.cableEntry,
              earthing: item.earthing,
              hsnCode: item.hsnCode,
              cutoutSize: item.cutoutSize,
              plateSize: item.plateSize,
              glass: item.glass,
              wireGuard: item.wireGuard,
              variantType: item.variantType,
              size: item.size,
              rpm: item.rpm,
              kW: item.kW,
              horsePower: item.horsePower,
              poReference: item.poReference,

              showVariantImages: item.showVariantImages,
              showVariantDrawings: item.showVariantDrawings,

              selectedVariantImageIds: item.selectedVariantImageIds,
              selectedVariantDrawingIds: item.selectedVariantDrawingIds,

              variantImagesSnapshot: item.variantImagesSnapshot,
              variantDrawingsSnapshot: item.variantDrawingsSnapshot,

              qty: item.qty,
              unit: item.unit,
              unitPrice: item.unitPrice,
              sortOrder: item.sortOrder,

              ComponentsOfProductInQuotation: {
                create: item.components
                  .filter((comp) => comp.item)
                  .map((comp) => ({
                    componentsOfQuotation: {
                      create: {
                        item: comp.item,
                        unit: comp.unit,
                      },
                    },
                  })),
              },
            },
          });
        }

        // 5) followup
        if (nextFollowupAt) {
          const existingInitialFollowup = await tx.quotationFollowup.findFirst({
            where: {
              quotationId: id,
              note: "Initial follow-up scheduled at finalize",
            },
            select: { id: true },
          });

          if (existingInitialFollowup) {
            await tx.quotationFollowup.update({
              where: { id: existingInitialFollowup.id },
              data: {
                scheduledAt: nextFollowupAt,
              },
            });
          } else {
            await tx.quotationFollowup.create({
              data: {
                quotationId: id,
                scheduledAt: nextFollowupAt,
                note: "Initial follow-up scheduled at finalize",
                createdById: session.user.id,
              },
            });
          }
        }
      },
      {
        timeout: 20000,
        maxWait: 10000,
      },
    );

    revalidatePath("/dashboard/sales/quotations");

    return { ok: true as const, message: "Quotation finalized" };
  } catch (error) {
    console.error("finalizeQuotationAction error:", error);

    return {
      ok: false as const,
      message: "Failed to finalize quotation",
    };
  }
};
