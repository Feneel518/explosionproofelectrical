"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

export async function reopenSalesOrderAsDraftAction(id: string) {
  const session = await requireAuth();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      quotation: true,
      poFile: true,
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          ComponentsOfProductInSalesOrder: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!order) {
    return { ok: false as const, message: "Sales order not found" };
  }

  if (order.deletedAt) {
    return { ok: false as const, message: "Deleted order cannot be edited" };
  }

  if (
    order.status === "DISPATCHED" ||
    order.status === "PARTIALLY_DISPATCHED" ||
    order.status === "INVOICED" ||
    order.status === "PARTIALLY_INVOICED" ||
    order.status === "COMPLETED"
  ) {
    return {
      ok: false as const,
      message: "Dispatched or invoiced order cannot be reopened",
    };
  }

  if (
    (order.totalDispatchedQty ?? 0) > 0 ||
    (order.totalInvoicedQty ?? 0) > 0
  ) {
    return {
      ok: false as const,
      message: "Order cannot be reopened after dispatch or invoice activity",
    };
  }

  const draftData = {
    header: {
      quotationId: order.quotationId,
      customerId: order.customerId,
      clientName: order.clientName,

      clientNameSnapshot: order.clientNameSnapshot,
      citySnapshot: order.citySnapshot,
      stateSnapshot: order.stateSnapshot,
      gstinSnapshot: order.gstinSnapshot,

      sourceType: order.sourceType,

      poNumber: order.poNumber,
      poDate: order.poDate ? order.poDate.toISOString() : null,
      orderDate: order.orderDate ? order.orderDate.toISOString() : null,

      receivedFromName: order.receivedFromName,
      receivedFromPhone: order.receivedFromPhone,
      receivedFromEmail: order.receivedFromEmail,

      additionalNotes: order.additionalNotes,
      deliveryDate: order.deliveryDate,
      poFile: order.poFile,
      gst: order.gst,
      packingCharges: order.packingCharges,
      paymentTerms: order.paymentTerms,
      transportationPayment: order.transportationPayment,
      discount: order.discount,

      subtotal: Number(order.subtotal ?? 0),
      discountTotal: Number(order.discountTotal ?? 0),
      taxableTotal: Number(order.taxableTotal ?? 0),
      gstTotal: Number(order.gstTotal ?? 0),
      grandTotal: Number(order.grandTotal ?? 0),

      totalItemsCount: order.totalItemsCount,
      totalOrderedQty: order.totalOrderedQty,
      totalDispatchedQty: order.totalDispatchedQty,
      totalInvoicedQty: order.totalInvoicedQty,
      totalPendingQty: order.totalPendingQty,

      isConvertedFromQuotation: order.isConvertedFromQuotation,
      isClosed: order.isClosed,
      isFullyDispatched: order.isFullyDispatched,
      isFullyInvoiced: order.isFullyInvoiced,
      isOverdueForDispatch: order.isOverdueForDispatch,
    },
    items: order.items.map((item) => ({
      id: item.id,
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

      showVariantImages: item.showVariantImages ?? false,
      showVariantDrawings: item.showVariantDrawings ?? false,

      selectedVariantImageIds: item.selectedVariantImageIds ?? [],
      selectedVariantDrawingIds: item.selectedVariantDrawingIds ?? [],

      variantImagesSnapshot: Array.isArray(item.variantImagesSnapshot)
        ? item.variantImagesSnapshot
        : [],
      variantDrawingsSnapshot: Array.isArray(item.variantDrawingsSnapshot)
        ? item.variantDrawingsSnapshot
        : [],

      qty: item.qty,
      unit: item.unit,
      unitPrice: Number(item.unitPrice ?? 0),

      dispatchedQty: item.dispatchedQty,
      invoicedQty: item.invoicedQty,
      pendingQty: item.pendingQty,

      lineSubtotal: Number(item.lineSubtotal ?? 0),
      lineGstTotal: Number(item.lineGstTotal ?? 0),
      lineGrandTotal: Number(item.lineGrandTotal ?? 0),

      sortOrder: item.sortOrder,

      component: item.ComponentsOfProductInSalesOrder.map((component) => ({
        id: component.id,
        item: component.item,
        unit: component.unit,
        qty: component.qty,
        sortOrder: component.sortOrder,
      })),
    })),
  };
  await prisma.$transaction(async (tx) => {
    await tx.salesOrder.update({
      where: { id },
      data: {
        status: "DRAFT",
        draftData,
        draftVersion: { increment: 1 },

        // reset execution/progress on reopen
        totalDispatchedQty: 0,
        totalInvoicedQty: 0,
        totalPendingQty: order.totalOrderedQty ?? 0,

        isClosed: false,
        isFullyDispatched: false,
        isFullyInvoiced: false,

        productionStartedAt: null,
        firstDispatchAt: null,
        lastDispatchAt: null,
        fullyDispatchedAt: null,
        firstInvoicedAt: null,
        fullyInvoicedAt: null,
        completedAt: null,
        cancelledAt: null,

        updatedById: session.user.id,
      },
    });

    // Reset linked quotation if this order came from quotation
    if (order.quotationId && order.quotation) {
      const revertQuotationStatus = order.quotation.nextFollowupAt
        ? "FOLLOWUP"
        : "SENT";

      await tx.quotation.update({
        where: { id: order.quotationId },
        data: {
          status: revertQuotationStatus,
          convertedToOrderAt: null,
          updatedById: session.user.id,
        },
      });
    }
  });

  revalidatePath("/dashboard/sales/orders");
  revalidatePath(`/dashboard/sales/orders/${id}`);
  revalidatePath(`/dashboard/sales/orders/${id}/edit`);

  return {
    ok: true as const,
    message: "Sales order reopened for editing",
  };
}
