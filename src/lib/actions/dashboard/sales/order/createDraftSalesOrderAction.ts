"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

function normalizeString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const createDraftSalesOrderAction = async (quotationId?: string | null) => {
  const session = await requireAuth();

  const fy = getFinancialYearLabel();

  const last = await prisma.salesOrder.findFirst({
    where: { orderFy: fy },
    orderBy: { orderNo: "desc" },
    select: { orderNo: true },
  });

  const nextOrderNo = (last?.orderNo ?? 0) + 1;
  const normalizedQuotationId = normalizeString(quotationId ?? null);

  const defaultDraft: { header: Record<string, any>; items: any[] } = {
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

  let draftData: { header: Record<string, any>; items: any[] } = defaultDraft;
  let linkedQuotationId: string | null = null;
  let sourceType: "DIRECT" | "QUOTATION" = "DIRECT";
  let shouldResetQuotationFollowup = false;
  let shouldMoveQuotationOutOfFollowup = false;

  if (normalizedQuotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: normalizedQuotationId },
      select: {
        id: true,
        customerId: true,
        clientName: true,
        receivedFromName: true,
        receivedFromPhone: true,
        receivedFromEmail: true,
        additionalNotes: true,
        deliveryDate: true,
        gst: true,
        packingCharges: true,
        paymentTerms: true,
        transportationPayment: true,
        discount: true,
        status: true,
        convertedToOrderAt: true,
        deletedAt: true,
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
                componentsOfQuotation: {
                  select: {
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

    if (!quotation) {
      return { ok: false as const, message: "Quotation not found" };
    }

    if (quotation.deletedAt) {
      return { ok: false as const, message: "Quotation is deleted" };
    }

    if (quotation.convertedToOrderAt) {
      return {
        ok: false as const,
        message: "Quotation is already converted to order",
      };
    }

    linkedQuotationId = quotation.id;
    sourceType = "QUOTATION";
    shouldResetQuotationFollowup = true;
    shouldMoveQuotationOutOfFollowup = quotation.status === "FOLLOWUP";

    const mappedItems = quotation.items.map((item, index) => {
      const qty = Number(item.qty ?? 1);
      const unitPrice = Number(item.unitPrice ?? 0);
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
      const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
      const lineSubtotal = safeQty * safeUnitPrice;

      return {
        id: crypto.randomUUID(),
        productId: item.productId ?? null,
        variantId: item.variantId ?? null,
        title: item.title ?? "",
        sku: item.sku ?? null,
        typeNumber: item.typeNumber ?? null,
        description: item.description ?? null,
        rating: item.rating ?? null,
        terminals: item.terminals ?? null,
        hardware: item.hardware ?? null,
        gasket: item.gasket ?? null,
        mounting: item.mounting ?? null,
        cableEntry: item.cableEntry ?? null,
        earthing: item.earthing ?? null,
        hsnCode: item.hsnCode ?? null,
        cutoutSize: item.cutoutSize ?? null,
        plateSize: item.plateSize ?? null,
        glass: item.glass ?? null,
        wireGuard: item.wireGuard ?? null,
        variantType: item.variantType ?? null,
        size: item.size ?? null,
        rpm: item.rpm ?? null,
        kW: item.kW ?? null,
        horsePower: item.horsePower ?? null,
        poReference: item.poReference ?? null,
        showVariantImages: Boolean(item.showVariantImages),
        showVariantDrawings: Boolean(item.showVariantDrawings),
        selectedVariantImageIds: item.selectedVariantImageIds ?? [],
        selectedVariantDrawingIds: item.selectedVariantDrawingIds ?? [],
        variantImagesSnapshot: Array.isArray(item.variantImagesSnapshot)
          ? item.variantImagesSnapshot
          : [],
        variantDrawingsSnapshot: Array.isArray(item.variantDrawingsSnapshot)
          ? item.variantDrawingsSnapshot
          : [],
        qty: safeQty,
        unit: item.unit ?? "Nos",
        unitPrice: safeUnitPrice,
        dispatchedQty: 0,
        invoicedQty: 0,
        pendingQty: safeQty,
        lineSubtotal,
        lineGstTotal: 0,
        lineGrandTotal: lineSubtotal,
        component:
          item.ComponentsOfProductInQuotation?.map((component, cIndex) => ({
            id: crypto.randomUUID(),
            item: component.componentsOfQuotation?.item ?? "",
            unit: component.componentsOfQuotation?.unit ?? "Nos.",
            qty: null,
            sortOrder: cIndex,
          })) ?? [],
        sortOrder: Number(item.sortOrder ?? index),
      };
    });

    const subtotal = mappedItems.reduce(
      (sum, item) => sum + Number(item.lineSubtotal ?? 0),
      0,
    );
    const totalOrderedQty = mappedItems.reduce(
      (sum, item) => sum + Number(item.qty ?? 0),
      0,
    );

    const resolvedClientName =
      normalizeString(quotation.customer?.companyName) ??
      normalizeString(quotation.clientName) ??
      normalizeString(quotation.receivedFromName);

    draftData = {
      header: {
        quotationId: quotation.id,

        customerId: quotation.customerId ?? null,
        clientName: resolvedClientName,

        clientNameSnapshot: resolvedClientName,
        citySnapshot: quotation.customer?.city ?? null,
        stateSnapshot: quotation.customer?.state ?? null,
        gstinSnapshot: quotation.customer?.gstin ?? null,

        sourceType: "QUOTATION",

        poNumber: null,
        poDate: null,
        orderDate: new Date().toISOString(),

        receivedFromName:
          normalizeString(quotation.receivedFromName) ??
          normalizeString(quotation.customer?.companyName),
        receivedFromPhone:
          normalizeString(quotation.receivedFromPhone) ??
          normalizeString(quotation.customer?.companyPhone),
        receivedFromEmail:
          normalizeString(quotation.receivedFromEmail) ??
          normalizeString(quotation.customer?.companyEmail),

        additionalNotes: quotation.additionalNotes ?? null,
        deliveryDate: quotation.deliveryDate ?? null,

        gst: quotation.gst,
        packingCharges: quotation.packingCharges,
        paymentTerms: quotation.paymentTerms,
        transportationPayment: quotation.transportationPayment,
        discount: quotation.discount ?? null,

        subtotal,
        discountTotal: 0,
        taxableTotal: subtotal,
        gstTotal: 0,
        grandTotal: subtotal,

        totalItemsCount: mappedItems.length,
        totalOrderedQty,
        totalDispatchedQty: 0,
        totalInvoicedQty: 0,
        totalPendingQty: totalOrderedQty,

        isConvertedFromQuotation: true,
        isClosed: false,
        isFullyDispatched: false,
        isFullyInvoiced: false,
        isOverdueForDispatch: false,
      },
      items: mappedItems,
    };
  }

  const orderCreateData = {
    orderFy: fy,
    orderNo: nextOrderNo,
    status: "DRAFT" as const,
    sourceType,
    quotationId: linkedQuotationId,
    customerId: draftData.header.customerId,
    clientName: draftData.header.clientName,
    clientNameSnapshot: draftData.header.clientNameSnapshot,
    citySnapshot: draftData.header.citySnapshot,
    stateSnapshot: draftData.header.stateSnapshot,
    gstinSnapshot: draftData.header.gstinSnapshot,
    isConvertedFromQuotation: sourceType === "QUOTATION",

    gst: "CGST_SGST_18" as const,
    packingCharges: "INCLUDED" as const,
    paymentTerms: "ADVANCE" as const,
    transportationPayment: "TO_PAY" as const,

    orderDate: new Date(),

    createdById: session.user.id,
    updatedById: session.user.id,

    draftData,
    draftVersion: 0,
  };

  const created = shouldResetQuotationFollowup && linkedQuotationId
    ? await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.salesOrder.create({
          data: orderCreateData,
          select: {
            id: true,
          },
        });

        await tx.quotation.update({
          where: { id: linkedQuotationId },
          data: {
            nextFollowupAt: null,
            status: shouldMoveQuotationOutOfFollowup ? "SENT" : undefined,
            updatedById: session.user.id,
          },
        });

        return createdOrder;
      })
    : await prisma.salesOrder.create({
        data: orderCreateData,
        select: {
          id: true,
        },
      });

  if (linkedQuotationId) {
    revalidatePath("/dashboard/sales/quotations");
    revalidatePath(`/dashboard/sales/quotations/${linkedQuotationId}`);
  }

  return { ok: true as const, id: created.id };
};
