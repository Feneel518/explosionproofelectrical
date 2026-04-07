"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { postStockMovement } from "@/lib/helpers/inventory/postStockMovement";
import { prisma } from "@/lib/prisma/db";
import { FINALIZE_TRANSACTION_OPTIONS } from "@/lib/prisma/transactionOptions";
import { Prisma } from "@prisma/client";

import { revalidatePath } from "next/cache";
import { DeliveryChallanDraftData } from "./createDraftDeliveryChallanAction";

function toDateOrNull(value?: string | Date | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export const finalizeDeliveryChallanAction = async (id: string) => {
  const session = await requireAuth();

  try {
    const challan = await prisma.deliveryChallan.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        draftData: true,
        challanNo: true,
        challanFy: true,
        challanCode: true,
      },
    });

    if (!challan) {
      return { ok: false as const, message: "Delivery challan not found." };
    }

    if (challan.status !== "DRAFT") {
      return {
        ok: false as const,
        message: "Delivery challan already issued.",
      };
    }

    const draft = challan.draftData as DeliveryChallanDraftData | null;

    if (!draft) {
      return { ok: false as const, message: "No draft data found" };
    }

    if (!draft.items?.length) {
      return { ok: false as const, message: "Add at least one item" };
    }

    const invalidItem = draft.items.find(
      (it) =>
        !it.title?.trim() || toNumber(it.qty) <= 0 || !it.productId?.trim(),
    );

    if (invalidItem) {
      return {
        ok: false as const,
        message: "Each item must have title and qty greater than 0",
      };
    }

    const challanDate = toDateOrNull(draft.header?.date) ?? new Date();
    const expectedReturnDate = toDateOrNull(draft.header?.expectedReturnDate);
    const expectedClosureDate = toDateOrNull(draft.header?.expectedClosureDate);

    const challanUpdateData = {
      status: "ISSUED" as const,
      type: draft.header?.type ?? "TO_BE_BILLED",
      partyType: draft.header?.partyType ?? "CUSTOMER",

      date: challanDate,
      issuedAt: new Date(),

      poNumber: draft.header?.poNumber?.trim() || null,

      ...(draft.header?.quotationId
        ? {
            quotation: {
              connect: { id: draft.header.quotationId },
            },
          }
        : {}),

      ...(draft.header?.customerId
        ? {
            customer: {
              connect: { id: draft.header.customerId },
            },
          }
        : {}),

      transporterName: draft.header?.transporterName?.trim() || null,
      vehicleNumber: draft.header?.vehicleNumber?.trim() || null,
      driverName: draft.header?.driverName?.trim() || null,
      driverPhone: draft.header?.driverPhone?.trim() || null,
      dispatchThrough: draft.header?.dispatchThrough?.trim() || null,
      lrNumber: draft.header?.lrNumber?.trim() || null,
      numberOfPackages:
        draft.header?.numberOfPackages == null
          ? null
          : toNumber(draft.header.numberOfPackages, 0),
      remarks: draft.header?.remarks?.trim() || null,

      expectedReturnDate,
      expectedClosureDate,
      finalizedAt: new Date(),

      updatedBy: { connect: { id: session.user.id } },
      finalizedBy: { connect: { id: session.user.id } },
    };

    const preparedItems = draft.items.map((it, index) => {
      const qty = toNumber(it.qty, 0);
      const closedQty = Math.max(0, Math.min(toNumber(it.closedQty, 0), qty));
      const pendingQty = Math.max(0, qty - closedQty);

      const normalizedProductId =
        typeof it.productId === "string" && it.productId.trim().length > 0
          ? it.productId.trim()
          : null;
      const normalizedItemId =
        typeof it.id === "string" && it.id.trim().length > 0 ? it.id.trim() : null;

      return {
        id: normalizedItemId,
        deliveryChallanId: id,

        kind: it.kind,
        productId: normalizedProductId,

        title: it.title?.trim() ?? "",
        sku: it.sku ?? null,
        typeNumber: it.typeNumber ?? null,
        description: it.description ?? null,
        hsnCode: it.hsnCode ?? null,
        unit: it.unit ?? null,

        qty,
        closedQty,
        pendingQty,
        sortOrder: toNumber(it.sortOrder, index),
      };
    });

    const productIds = Array.from(
      new Set(
        preparedItems
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (productIds.length > 0) {
      const existingProducts = await prisma.productVariant.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const existingProductIds = new Set(existingProducts.map((p) => p.id));

      const invalidProduct = preparedItems.find(
        (item) => item.productId && !existingProductIds.has(item.productId),
      );

      if (invalidProduct) {
        return {
          ok: false as const,
          message: `Invalid product selected for item "${invalidProduct.title}"`,
        };
      }
    }

    if (draft.header?.customerId) {
      const customerExists = await prisma.customer.findUnique({
        where: { id: draft.header.customerId },
        select: { id: true },
      });

      if (!customerExists) {
        return {
          ok: false as const,
          message: "Selected customer does not exist",
        };
      }
    }

    if (draft.header?.quotationId) {
      const quotationExists = await prisma.quotation.findUnique({
        where: { id: draft.header.quotationId },
        select: { id: true },
      });

      if (!quotationExists) {
        return {
          ok: false as const,
          message: "Selected quotation does not exist",
        };
      }
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.deliveryChallan.update({
          where: { id },
          data: challanUpdateData,
        });

        const existingItems = await tx.deliveryChallanItem.findMany({
          where: { deliveryChallanId: id },
          select: { id: true },
        });

        const existingItemIds = existingItems.map((item) => item.id);

        if (existingItemIds.length > 0) {
          await tx.deliveryChallanItem.deleteMany({
            where: {
              id: { in: existingItemIds },
            },
          });
        }

        for (const item of preparedItems) {
          const createData: Prisma.DeliveryChallanItemUncheckedCreateInput = {
            deliveryChallanId: item.deliveryChallanId,

            kind: item.kind,
            productVariantId: item.productId,

            title: item.title,
            sku: item.sku,
            typeNumber: item.typeNumber,
            description: item.description,
            hsnCode: item.hsnCode,
            unit: item.unit,

            qty: item.qty,
            closedQty: item.closedQty,
            pendingQty: item.pendingQty,
            sortOrder: item.sortOrder,
          };

          if (item.id) {
            createData.id = item.id;
          }

          await tx.deliveryChallanItem.create({
            data: createData,
          });

          if (item.productId && item.qty > 0) {
            await postStockMovement(tx, {
              productVariantId: item.productId,
              movementType: "OUT",
              referenceType: "DELIVERY_CHALLAN",
              referenceId: id,
              referenceNo: challan.challanCode,
              qty: item.qty,
              movementDate: challanDate,
              actorName: session.user.email ?? null,
              remarks: `Dispatch via delivery challan ${challan.challanCode}`,
              createdById: session.user.id,
            });
          }
        }
      },
      FINALIZE_TRANSACTION_OPTIONS,
    );

    revalidatePath("/dashboard/sales/delivery-challans");
    revalidatePath(`/dashboard/sales/delivery-challans/${id}`);
    revalidatePath("/dashboard/inventory/stock");
    revalidatePath("/dashboard/inventory/movements");

    return { ok: true as const, message: "Delivery challan finalized" };
  } catch (error: any) {
    console.error("finalizeDeliveryChallanAction error:", error);

    return {
      ok: false as const,
      message:
        error?.message || error?.code || "Failed to finalize delivery challan",
    };
  }
};
