"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { InvoiceDraftData } from "@/lib/types/Invoicetable";
import { ProductMediaKind } from "@prisma/client";
import {
  refreshSalesOrderInvoiceProgress,
  rollbackInvoiceEffects,
} from "./invoiceSettlement";

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
        customerId: true,
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

    const isOrderLinked = Boolean(invoice.salesOrderId);

    const preparedItems = draft.items.map((it, index) => {
      const qty = toNumber(it.qty, 0);
      const unitPrice = toNumber(it.unitPrice, 0);
      const lineSubtotal = qty * unitPrice;

      return {
        draftItemId: it.id,
        salesOrderItemId: it.salesOrderItemId,
        isManual: Boolean(it.isManual),
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
        cimfrNumber: it.cimfrNumber ?? null,
        pesoNumber: it.pesoNumber ?? null,
        selectedSerialIds: Array.isArray(it.selectedSerialIds)
          ? Array.from(new Set(it.selectedSerialIds.filter(Boolean)))
          : [],
        resolvedSerialNumbers: [] as string[],
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
      if (invoice.salesOrderId) {
        const linkedOrder = await tx.salesOrder.findUnique({
          where: { id: invoice.salesOrderId },
          select: { status: true },
        });

        if (!linkedOrder) {
          throw new Error("Linked sales order not found");
        }
        if (linkedOrder.status === "CANCELLED") {
          throw new Error("Cancelled order cannot be invoiced");
        }
        if (linkedOrder.status === "COMPLETED") {
          throw new Error("Completed order cannot be invoiced");
        }
      }

        await rollbackInvoiceEffects(tx, {
          invoiceId: invoice.id,
          salesOrderId: invoice.salesOrderId ?? null,
          rollbackSalesOrder: false,
        });

      const liveMap = new Map<
        string,
        {
          id: string;
          productId: string | null;
          variantId: string | null;
          qty: number;
          invoicedQty: number;
          dispatchedQty: number;
        }
      >();

      if (isOrderLinked && invoice.salesOrderId) {
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

        for (const liveOrderItem of liveOrderItems) {
          liveMap.set(liveOrderItem.id, liveOrderItem);
        }
      }

      for (const item of preparedItems) {
        if (!item.salesOrderItemId) {
          item.salesOrderItemId = item.draftItemId || crypto.randomUUID();
        }

        if (!isOrderLinked || item.isManual) {
          continue;
        }

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

      const productIds = Array.from(
        new Set(
          preparedItems
            .map((item) => item.productId)
            .filter((productId): productId is string => Boolean(productId)),
        ),
      );
      const trackedProducts = productIds.length
        ? await tx.product.findMany({
            where: { id: { in: productIds }, serialTrackingEnabled: true },
            select: { id: true, name: true },
          })
        : [];
      const trackedProductById = new Map(
        trackedProducts.map((product) => [product.id, product]),
      );
      const everySelectedSerialId: string[] = [];

      for (const item of preparedItems) {
        const trackedProduct = item.productId
          ? trackedProductById.get(item.productId)
          : null;

        if (trackedProduct && item.selectedSerialIds.length !== item.qty) {
          throw new Error(
            `${trackedProduct.name} requires exactly ${item.qty} serial number${item.qty === 1 ? "" : "s"}`,
          );
        }
        if (!trackedProduct && item.selectedSerialIds.length > 0) {
          throw new Error(`Serial tracking is not enabled for ${item.title}`);
        }
        everySelectedSerialId.push(...item.selectedSerialIds);
      }

      if (new Set(everySelectedSerialId).size !== everySelectedSerialId.length) {
        throw new Error("The same serial number cannot be used on multiple invoice items");
      }

      const selectedSerialRows = everySelectedSerialId.length
        ? await tx.productSerial.findMany({
            where: { id: { in: everySelectedSerialId } },
            select: {
              id: true,
              productId: true,
              status: true,
              serialNumber: true,
            },
          })
        : [];
      const selectedSerialById = new Map(
        selectedSerialRows.map((serial) => [serial.id, serial]),
      );

      for (const item of preparedItems) {
        item.resolvedSerialNumbers = item.selectedSerialIds.map((serialId) => {
          const serial = selectedSerialById.get(serialId);
          if (!serial) throw new Error("A selected serial number no longer exists");
          if (serial.status !== "AVAILABLE") {
            throw new Error(`${serial.serialNumber} is no longer available`);
          }
          if (serial.productId !== item.productId) {
            throw new Error(`${serial.serialNumber} does not belong to ${item.title}`);
          }
          return serial.serialNumber;
        });
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

          customerId: draft.header.customerId ?? invoice.customerId ?? null,
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
          transportationPayment:
            draft.header.transportationPayment === "PAID" ? "PAID" : "TO_PAY",
          transportationAmount:
            draft.header.transportationAmount !== null &&
            draft.header.transportationAmount !== undefined
              ? toNumber(draft.header.transportationAmount, 0)
              : null,
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
            salesOrderItemId:
              isOrderLinked && !item.isManual ? item.salesOrderItemId : null,
            productId: item.productId,
            variantId: item.variantId,
            title: item.title,
            sku: item.sku,
            typeNumber: item.typeNumber,
            description: item.description,
            hsnCode: item.hsnCode,
            unit: item.unit,
            cimfrNumber: item.cimfrNumber,
            pesoNumber: item.pesoNumber,
            serialNumber:
              item.resolvedSerialNumbers.length > 0
                ? item.resolvedSerialNumbers.join(", ")
                : null,
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

        if (item.selectedSerialIds.length > 0) {
          const assigned = await tx.productSerial.updateMany({
            where: {
              id: { in: item.selectedSerialIds },
              productId: item.productId ?? undefined,
              status: "AVAILABLE",
              invoiceItemId: null,
            },
            data: {
              status: "INVOICED",
              invoiceItemId: createdInvoiceItem.id,
              invoicedAt: new Date(),
            },
          });
          if (assigned.count !== item.selectedSerialIds.length) {
            throw new Error(`One or more serial numbers for ${item.title} were already used`);
          }
        }

        if (item.salesOrderItemId) {
          invoiceItemIdBySalesOrderItemId.set(
            item.salesOrderItemId,
            createdInvoiceItem.id,
          );
        }
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

      if (isOrderLinked && invoice.salesOrderId) {
        for (const item of preparedItems) {
          if (item.isManual || !item.salesOrderItemId) continue;

          const live = liveMap.get(item.salesOrderItemId);
          if (!live) continue;

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

        await refreshSalesOrderInvoiceProgress(tx, {
          salesOrderId: invoice.salesOrderId,
          updatedById: session.user.id,
        });
      }
    }, FINALIZE_TRANSACTION_OPTIONS);

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${id}`);
    if (invoice.salesOrderId) {
      revalidatePath(`/dashboard/sales/orders/${invoice.salesOrderId}`);
    }
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");
    revalidatePath("/dashboard/serial");

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
