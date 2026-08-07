"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { SalesOrderDraftData } from "@/lib/types/SalesOrderTypes";
import { ProductMediaKind } from "@prisma/client";
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

function normalizeString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export const finalizeSalesOrderAction = async (id: string) => {
  const session = await requireAuth();

  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        draftData: true,
        orderNo: true,
        orderFy: true,
      },
    });

    if (!order) {
      return { ok: false as const, message: "Order not found" };
    }

    if (order.status !== "DRAFT") {
      return { ok: false as const, message: "Order already finalized" };
    }

    const draft = order.draftData as SalesOrderDraftData | null;

    if (!draft) {
      return { ok: false as const, message: "No draft data found" };
    }

    if (!draft.items?.length) {
      return { ok: false as const, message: "Add at least one item" };
    }

    console.log(draft);

    let quotationId = draft.header?.quotationId ?? null;
    const draftCustomerId = draft.header?.customerId ?? null;
    let quotationToUnlink: { id: string; nextFollowupAt: Date | null } | null =
      null;

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

    const poDate = toDateOrNull(draft.header?.poDate);
    const orderDate = toDateOrNull(draft.header?.orderDate) ?? new Date();

    const preparedItems = draft.items.map((it, index) => {
      const qty = toNumber(it.qty, 0);
      const unitPrice = toNumber(it.unitPrice, 0);
      const lineSubtotal = qty * unitPrice;

      return {
        id: it.id,
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
        qty,
        unit: it.unit ?? null,
        unitPrice,
        lineSubtotal,
        lineGstTotal: 0,
        lineGrandTotal: lineSubtotal,
        pendingQty: qty,
        sortOrder: toNumber(it.sortOrder, index),
        components:
          it.component?.map((comp) => ({
            item: comp.item?.trim() ?? "",
            unit: comp.unit ?? null,
            qty: comp.qty ?? null,
          })) ?? [],
      };
    });

    const subtotal = preparedItems.reduce(
      (acc, item) => acc + item.lineSubtotal,
      0,
    );
    const grandTotal = subtotal;

    if (quotationId) {
      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        select: {
          id: true,
          customerId: true,
          status: true,
          deletedAt: true,
          convertedToOrderAt: true,
          nextFollowupAt: true,
        },
      });

      if (!quotation) {
        return { ok: false as const, message: "Linked quotation not found" };
      }

      if (quotation.deletedAt) {
        return { ok: false as const, message: "Linked quotation is deleted" };
      }
      if (quotation.convertedToOrderAt) {
        return {
          ok: false as const,
          message: "Quotation is already converted to an order",
        };
      }

      if ((quotation.customerId ?? null) !== (draftCustomerId ?? null)) {
        quotationToUnlink = {
          id: quotation.id,
          nextFollowupAt: quotation.nextFollowupAt ?? null,
        };
        quotationId = null;
      }
    }

    const poFiles =
      draft.header?.poFile?.map((file) => ({
        kind: "DRAWING" as ProductMediaKind,
        url: file.url,
        title: file.title ?? null,
      })) ?? [];

    const customer = draftCustomerId
      ? await prisma.customer.findUnique({
          where: { id: draftCustomerId },
          select: {
            companyName: true,
            city: true,
            state: true,
            gstin: true,
          },
        })
      : null;

    const clientNameSnapshot =
      normalizeString(customer?.companyName) ??
      normalizeString(draft.header?.clientNameSnapshot) ??
      normalizeString(draft.header?.clientName) ??
      normalizeString(draft.header?.receivedFromName);
    const citySnapshot =
      normalizeString(customer?.city) ??
      normalizeString(draft.header?.citySnapshot);
    const stateSnapshot =
      normalizeString(customer?.state) ??
      normalizeString(draft.header?.stateSnapshot);
    const gstinSnapshot =
      normalizeString(customer?.gstin) ??
      normalizeString(draft.header?.gstinSnapshot);

    await prisma.$transaction(async (tx) => {
      await tx.salesOrder.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          customerId: draft.header?.customerId ?? null,
          clientName: clientNameSnapshot,
          clientNameSnapshot,
          citySnapshot,
          stateSnapshot,
          gstinSnapshot,
          quotationId,
          sourceType: quotationId ? "QUOTATION" : "DIRECT",
          isConvertedFromQuotation: Boolean(quotationId),
          convertedFromQuotationAt: quotationId ? new Date() : null,
          receivedFromName: draft.header?.receivedFromName ?? null,
          receivedFromPhone: draft.header?.receivedFromPhone ?? null,
          receivedFromEmail: draft.header?.receivedFromEmail ?? null,
          poNumber: draft.header?.poNumber ?? null,
          poDate,
          poFile: {
            deleteMany: {},
            create: poFiles,
          },
          orderDate,
          additionalNotes: draft.header?.additionalNotes ?? null,
          deliveryDate: draft.header?.deliveryDate ?? null,
          gst: draft.header?.gst ?? "CGST_SGST_18",
          packingCharges: draft.header?.packingCharges ?? "INCLUDED",
          paymentTerms: draft.header?.paymentTerms ?? "ADVANCE",
          transportationPayment:
            draft.header?.transportationPayment ?? "TO_PAY",
          discount: draft.header?.discount ?? null,
          subtotal,
          discountTotal: 0,
          taxableTotal: subtotal,
          gstTotal: 0,
          grandTotal,
          totalItemsCount: preparedItems.length,
          totalOrderedQty: preparedItems.reduce(
            (acc, item) => acc + item.qty,
            0,
          ),
          totalDispatchedQty: 0,
          totalInvoicedQty: 0,
          totalPendingQty: preparedItems.reduce(
            (acc, item) => acc + item.qty,
            0,
          ),
          confirmedAt: new Date(),
          updatedById: session.user.id,
        },
      });

      if (quotationToUnlink) {
        const revertQuotationStatus = quotationToUnlink.nextFollowupAt
          ? "FOLLOWUP"
          : "SENT";

        await tx.quotation.update({
          where: { id: quotationToUnlink.id },
          data: {
            status: revertQuotationStatus,
            convertedToOrderAt: null,
            updatedById: session.user.id,
          },
        });
      }

      if (quotationId) {
        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: "WON",
            convertedToOrderAt: new Date(),
            nextFollowupAt: null,
            updatedById: session.user.id,
          },
        });
      }

      const existingItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: id },
        select: { id: true },
      });

      const existingItemIds = existingItems.map((item) => item.id);

      if (existingItemIds.length > 0) {
        await tx.componentsOfProductInSalesOrder.deleteMany({
          where: { salesOrderItemId: { in: existingItemIds } },
        });

        await tx.salesOrderItem.deleteMany({
          where: { id: { in: existingItemIds } },
        });
      }

      for (const item of preparedItems) {
        await tx.salesOrderItem.create({
          data: {
            id: item.id,
            salesOrderId: id,
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
            lineSubtotal: item.lineSubtotal,
            lineGstTotal: item.lineGstTotal,
            lineGrandTotal: item.lineGrandTotal,
            dispatchedQty: 0,
            invoicedQty: 0,
            pendingQty: item.pendingQty,
            sortOrder: item.sortOrder,
            ComponentsOfProductInSalesOrder: {
              create: item.components
                .filter((comp) => comp.item)
                .map((comp, idx) => ({
                  item: comp.item,
                  unit: comp.unit,
                  qty: comp.qty,
                  sortOrder: idx,
                })),
            },
          },
        });
      }
    }, FINALIZE_TRANSACTION_OPTIONS);

    revalidatePath("/dashboard/sales/orders");
    revalidatePath("/dashboard/sales/quotations");
    if (quotationId) {
      revalidatePath(`/dashboard/sales/quotations/${quotationId}`);
    }
    if (quotationToUnlink) {
      revalidatePath(`/dashboard/sales/quotations/${quotationToUnlink.id}`);
    }

    return { ok: true as const, message: "Order finalized" };
  } catch (error) {
    console.error("finalizeSalesOrderAction error:", error);

    return {
      ok: false as const,
      message: "Failed to finalize order",
      error: error,
    };
  }
};
