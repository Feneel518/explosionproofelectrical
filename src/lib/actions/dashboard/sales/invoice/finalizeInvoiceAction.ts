"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { InvoiceDraftData } from "@/lib/types/Invoicetable";
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

export const finalizeInvoiceAction = async (id: string) => {
  const session = await requireAuth();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        invoiceNo: true,
        invoiceFy: true,
        salesOrderId: true,
        draftData: true,
      },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    if (invoice.status !== "DRAFT") {
      return { ok: false as const, message: "Invoice already finalized" };
    }

    const draft = invoice.draftData as InvoiceDraftData | null;

    if (!draft) {
      return { ok: false as const, message: "No draft data found" };
    }

    if (!draft.items?.length) {
      return { ok: false as const, message: "Add at least one invoice item" };
    }

    const preparedItems = draft.items.map((it, index) => {
      const qty = toNumber(it.qty, 0);
      const unitPrice = toNumber(it.unitPrice, 0);
      const lineSubtotal = qty * unitPrice;

      return {
        draftItemId: it.id,
        salesOrderItemId: it.salesOrderItemId,
        productId: it.productId ?? null,
        variantId: it.variantId ?? null,
        title: it.title?.trim() ?? "",
        sku: it.sku ?? null,
        typeNumber: it.typeNumber ?? null,
        description: it.description ?? null,
        hsnCode: it.hsnCode ?? null,
        unit: it.unit ?? null,
        orderedQty: toNumber(it.orderedQty, 0),
        alreadyInvoiced: toNumber(it.alreadyInvoiced, 0),
        alreadyDispatched: qty,
        qty,
        unitPrice,
        lineSubtotal,
        lineGstTotal: toNumber(it.lineGstTotal, 0),
        lineGrandTotal: lineSubtotal + toNumber(it.lineGstTotal, 0),
        sortOrder: toNumber(it.sortOrder, index),
        productPicture: Array.isArray(it.productPicture)
          ? it.productPicture
          : [],
      };
    });

    const invalidItem = preparedItems.find(
      (it) => !it.title || it.qty <= 0 || it.unitPrice < 0,
    );

    if (invalidItem) {
      return {
        ok: false as const,
        message:
          "Each invoice item must have title, qty > 0 and valid unit price",
      };
    }

    await prisma.$transaction(async (tx) => {
      const liveOrderItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: invoice.salesOrderId },
        select: {
          id: true,
          productId: true,
          variantId: true,
          qty: true,
          invoicedQty: true,
          dispatchedQty: true,
        },
      });

      const liveMap = new Map(liveOrderItems.map((item) => [item.id, item]));

      for (const item of preparedItems) {
        const live = liveMap.get(item.salesOrderItemId);

        if (!live) {
          throw new Error(
            `Sales order item not found: ${item.salesOrderItemId}`,
          );
        }

        const remaining = Math.max(live.qty - live.invoicedQty, 0);

        if (item.qty > remaining) {
          throw new Error(
            `Invoice qty exceeds remaining quantity for ${item.title}`,
          );
        }

        if (!item.productId && live.productId) {
          item.productId = live.productId;
        }
        if (!item.variantId && live.variantId) {
          item.variantId = live.variantId;
        }
      }

      const movementDate =
        toDateOrNull(draft.header.dispatchDate) ??
        toDateOrNull(draft.header.invoiceDate) ??
        new Date();
      const referenceNo = formatFinancialDocumentNumber(
        invoice.invoiceFy,
        invoice.invoiceNo,
      );

      const variantIds = Array.from(
        new Set(
          preparedItems
            .map((item) => item.variantId)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const bomRows =
        variantIds.length > 0
          ? await tx.variantBom.findMany({
              where: {
                variantId: { in: variantIds },
                isActive: true,
              },
              include: {
                items: {
                  select: {
                    componentType: true,
                    rawMaterialId: true,
                    castingMasterId: true,
                    qtyPerUnit: true,
                  },
                },
              },
            })
          : [];

      const bomByVariantId = new Map(
        bomRows.map((row) => [row.variantId, row]),
      );

      const rawConsumption = new Map<string, number>();
      const castingConsumption = new Map<string, number>();

      for (const item of preparedItems) {
        if (!item.variantId) continue;

        const bom = bomByVariantId.get(item.variantId);
        if (!bom || !bom.items?.length) continue;

        for (const bomItem of bom.items) {
          const qtyPerUnit = Math.max(
            0,
            Math.trunc(Number(bomItem.qtyPerUnit || 0)),
          );
          if (qtyPerUnit <= 0) continue;

          const consumeQty =
            qtyPerUnit * Math.max(0, Math.trunc(Number(item.qty || 0)));
          if (consumeQty <= 0) continue;

          if (
            bomItem.componentType === "RAW_MATERIAL" &&
            bomItem.rawMaterialId
          ) {
            const current = rawConsumption.get(bomItem.rawMaterialId) ?? 0;
            rawConsumption.set(bomItem.rawMaterialId, current + consumeQty);
          } else if (
            bomItem.componentType === "CASTING" &&
            bomItem.castingMasterId
          ) {
            const current =
              castingConsumption.get(bomItem.castingMasterId) ?? 0;
            castingConsumption.set(
              bomItem.castingMasterId,
              current + consumeQty,
            );
          }
        }
      }

      for (const [rawMaterialId, qty] of rawConsumption) {
        await postStockMovement(tx, {
          rawMaterialId,
          movementType: "OUT",
          referenceType: "INVOICE",
          referenceId: invoice.id,
          referenceNo,
          qty,
          movementDate,
          actorName: session.user.email || null,
          remarks: `BOM consumption via invoice ${referenceNo}`,
          createdById: session.user.id,
        });
      }

      for (const [castingMasterId, qty] of castingConsumption) {
        await postStockMovement(tx, {
          castingMasterId,
          movementType: "OUT",
          referenceType: "INVOICE",
          referenceId: invoice.id,
          referenceNo,
          qty,
          movementDate,
          actorName: session.user.email || null,
          remarks: `BOM consumption via invoice ${referenceNo}`,
          createdById: session.user.id,
        });
      }

      await tx.productMedia.deleteMany({
        where: {
          invoiceItem: {
            invoiceId: id,
          },
        },
      });

      await tx.invoicePackageItem.deleteMany({
        where: {
          invoicePackage: {
            invoiceId: id,
          },
        },
      });
      await tx.invoicePackage.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.productMedia.deleteMany({ where: { invoiceId: id } });

      await tx.invoice.update({
        where: { id },
        data: {
          invoiceDate: toDateOrNull(draft.header.invoiceDate) ?? new Date(),

          customerId: draft.header.customerId ?? null,
          poNumber: draft.header.poNumber ?? null,
          poDate: toDateOrNull(draft.header.poDate),

          clientNameSnapshot: draft.header.clientNameSnapshot ?? null,
          citySnapshot: draft.header.citySnapshot ?? null,
          stateSnapshot: draft.header.stateSnapshot ?? null,
          gstinSnapshot: draft.header.gstinSnapshot ?? null,

          dispatchDate: toDateOrNull(draft.header.dispatchDate),
          transporterName: draft.header.transporterName ?? null,
          vehicleNumber: draft.header.vehicleNumber ?? null,
          driverName: draft.header.driverName ?? null,
          driverPhone: draft.header.driverPhone ?? null,
          dispatchThrough: draft.header.dispatchThrough ?? null,
          lrNumber: draft.header.lrNumber ?? null,
          ewayBill: draft.header.ewayBill ?? null,
          remarks: draft.header.remarks ?? null,

          subtotal: toNumber(draft.header.subtotal, 0),
          taxableTotal: toNumber(draft.header.taxableTotal, 0),
          gstTotal: toNumber(draft.header.gstTotal, 0),
          grandTotal: toNumber(draft.header.grandTotal, 0),

          status: "FINALIZED",
        },
      });

      const lrCopyRows = Array.isArray(draft.header.lrCopy)
        ? draft.header.lrCopy
            .filter((file) => file?.url)
            .map((file) => ({
              invoiceId: id,
              kind:
                file.kind === "DRAWING"
                  ? ProductMediaKind.DRAWING
                  : ProductMediaKind.IMAGE,
              url: file.url,
              title: file.title ?? null,
            }))
        : [];

      if (lrCopyRows.length > 0) {
        await tx.productMedia.createMany({
          data: lrCopyRows,
        });
      }

      const invoiceItemIdBySalesOrderItemId = new Map<string, string>();
      const invoiceItemIdByDraftItemId = new Map<string, string>();

      for (const item of preparedItems) {
        const createdInvoiceItem = await tx.invoiceItem.create({
          data: {
            invoiceId: id,
            salesOrderItemId: item.salesOrderItemId,
            productId: item.productId,
            variantId: item.variantId,
            title: item.title,
            sku: item.sku,
            typeNumber: item.typeNumber,
            description: item.description,
            hsnCode: item.hsnCode,
            unit: item.unit,
            orderedQty: item.orderedQty,
            alreadyInvoiced: item.alreadyInvoiced,
            alreadyDispatched: item.qty,
            qty: item.qty,
            unitPrice: item.unitPrice,
            lineSubtotal: item.lineSubtotal,
            lineGstTotal: item.lineGstTotal,
            lineGrandTotal: item.lineGrandTotal,
            sortOrder: item.sortOrder,
          },
          select: { id: true },
        });

        invoiceItemIdBySalesOrderItemId.set(
          item.salesOrderItemId,
          createdInvoiceItem.id,
        );
        if (item.draftItemId) {
          invoiceItemIdByDraftItemId.set(
            item.draftItemId,
            createdInvoiceItem.id,
          );
        }

        const pictureRows = (item.productPicture ?? [])
          .filter((media) => media?.url)
          .map((media) => ({
            invoiceItemId: createdInvoiceItem.id,
            kind:
              media.kind === "DRAWING"
                ? ProductMediaKind.DRAWING
                : ProductMediaKind.IMAGE,
            url: media.url,
            title: media.title ?? null,
          }));

        if (pictureRows.length > 0) {
          await tx.productMedia.createMany({
            data: pictureRows,
          });
        }
      }

      const draftPackages = Array.isArray(draft.packages) ? draft.packages : [];

      for (let pkgIndex = 0; pkgIndex < draftPackages.length; pkgIndex++) {
        const pkg = draftPackages[pkgIndex];
        if (!pkg) continue;

        const packageItemsRaw = Array.isArray(pkg.items) ? pkg.items : [];

        const packageItems = packageItemsRaw
          .map((pkgItem) => {
            const bySalesOrderItemId =
              typeof pkgItem.salesOrderItemId === "string"
                ? invoiceItemIdBySalesOrderItemId.get(pkgItem.salesOrderItemId)
                : null;

            const byDraftItemId =
              typeof pkgItem.invoiceItemDraftId === "string"
                ? invoiceItemIdByDraftItemId.get(pkgItem.invoiceItemDraftId)
                : null;

            const invoiceItemId = bySalesOrderItemId ?? byDraftItemId ?? null;
            const qty = toNumber(pkgItem.qty, 0);

            if (!invoiceItemId || qty <= 0) return null;

            return {
              invoiceItemId,
              qty,
            };
          })
          .filter(
            (
              item,
            ): item is {
              invoiceItemId: string;
              qty: number;
            } => Boolean(item),
          );

        const mergedPackageItemsMap = new Map<string, number>();
        for (const packageItem of packageItems) {
          const existingQty =
            mergedPackageItemsMap.get(packageItem.invoiceItemId) ?? 0;
          mergedPackageItemsMap.set(
            packageItem.invoiceItemId,
            existingQty + packageItem.qty,
          );
        }

        const mergedPackageItems = Array.from(mergedPackageItemsMap).map(
          ([invoiceItemId, qty]) => ({
            invoiceItemId,
            qty,
          }),
        );

        if (!mergedPackageItems.length) continue;

        const packageRemarks =
          typeof pkg.remarks === "string" ? pkg.remarks.trim() : "";

        const createdPackage = await tx.invoicePackage.create({
          data: {
            invoiceId: id,
            packageNo:
              (typeof pkg.packageNo === "string" && pkg.packageNo.trim()) ||
              String(pkgIndex + 1),
            packageType:
              typeof pkg.packageType === "string" && pkg.packageType.trim()
                ? pkg.packageType.trim()
                : null,
            label:
              typeof pkg.label === "string" && pkg.label.trim()
                ? pkg.label.trim()
                : null,
            remarks: packageRemarks || null,
            grossWeight:
              pkg.grossWeight === null || pkg.grossWeight === undefined
                ? null
                : toNumber(pkg.grossWeight, 0),
            netWeight:
              pkg.netWeight === null || pkg.netWeight === undefined
                ? null
                : toNumber(pkg.netWeight, 0),
            sortOrder: pkgIndex,
          },
          select: { id: true },
        });

        for (const packageItem of mergedPackageItems) {
          await tx.invoicePackageItem.create({
            data: {
              invoicePackageId: createdPackage.id,
              invoiceItemId: packageItem.invoiceItemId,
              qty: packageItem.qty,
            },
          });
        }
      }

      for (const item of preparedItems) {
        const live = liveMap.get(item.salesOrderItemId)!;
        const newInvoicedQty = live.invoicedQty + item.qty;
        const newDispatchedQty = newInvoicedQty;
        const newPendingQty = Math.max(live.qty - newInvoicedQty, 0);

        await tx.salesOrderItem.update({
          where: { id: item.salesOrderItemId },
          data: {
            invoicedQty: newInvoicedQty,
            dispatchedQty: newDispatchedQty,
            pendingQty: newPendingQty,
          },
        });
      }

      const refreshedItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: invoice.salesOrderId },
        select: {
          qty: true,
          invoicedQty: true,
          dispatchedQty: true,
        },
      });

      const totalOrderedQty = refreshedItems.reduce((a, i) => a + i.qty, 0);
      const totalInvoicedQty = refreshedItems.reduce(
        (a, i) => a + i.invoicedQty,
        0,
      );
      const totalDispatchedQty = refreshedItems.reduce(
        (a, i) => a + i.dispatchedQty,
        0,
      );
      const totalPendingQty = refreshedItems.reduce(
        (a, i) => a + Math.max(i.qty - i.invoicedQty, 0),
        0,
      );

      const isFullyInvoiced =
        refreshedItems.length > 0 &&
        refreshedItems.every((i) => i.invoicedQty >= i.qty);

      const isFullyDispatched =
        refreshedItems.length > 0 &&
        refreshedItems.every((i) => i.dispatchedQty >= i.qty);

      let status:
        | "CONFIRMED"
        | "PARTIALLY_DISPATCHED"
        | "DISPATCHED"
        | "PARTIALLY_INVOICED"
        | "INVOICED"
        | "COMPLETED" = "CONFIRMED";

      if (isFullyInvoiced && isFullyDispatched) {
        status = "COMPLETED";
      } else if (isFullyInvoiced) {
        status = "INVOICED";
      } else if (totalInvoicedQty > 0) {
        status = "PARTIALLY_INVOICED";
      } else if (isFullyDispatched) {
        status = "DISPATCHED";
      } else if (totalDispatchedQty > 0) {
        status = "PARTIALLY_DISPATCHED";
      }

      await tx.salesOrder.update({
        where: { id: invoice.salesOrderId },
        data: {
          totalOrderedQty,
          totalDispatchedQty,
          totalInvoicedQty,
          totalPendingQty,
          isFullyInvoiced,
          isFullyDispatched,
          firstInvoicedAt: totalInvoicedQty > 0 ? new Date() : undefined,
          fullyInvoicedAt: isFullyInvoiced ? new Date() : null,
          status,
          updatedById: session.user.id,
        },
      });
    });

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${id}`);
    revalidatePath(`/dashboard/sales/orders/${invoice.salesOrderId}`);
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");

    return { ok: true as const, message: "Invoice finalized" };
  } catch (error) {
    console.error("finalizeInvoiceAction error:", error);

    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Failed to finalize invoice",
    };
  }
};
