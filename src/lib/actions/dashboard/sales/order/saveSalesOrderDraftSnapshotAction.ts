"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { SalesOrderDraftData } from "@/lib/types/SalesOrderTypes";
import { Prisma } from "@prisma/client";

export const saveSalesOrderDraftSnapshotAction = async ({
  salesOrderId,
  draft,
  clientVersion,
}: {
  salesOrderId: string;
  draft: SalesOrderDraftData;
  clientVersion: number;
}) => {
  const session = await requireAuth();

  const normalizeId = (value?: string | null) => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  };

  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    select: {
      id: true,
      status: true,
      draftVersion: true,
      quotationId: true,
      sourceType: true,
      isConvertedFromQuotation: true,
      quotation: {
        select: {
          id: true,
          customerId: true,
          nextFollowupAt: true,
        },
      },
    },
  });

  if (!order) return { ok: false as const, message: "Order not found" };
  if (order.status !== "DRAFT")
    return { ok: false as const, message: "Cannot autosave non-draft order" };

  if (clientVersion !== order.draftVersion) {
    return {
      ok: false as const,
      code: "VERSION_CONFLICT" as const,
      serverVersion: order.draftVersion,
    };
  }

  const linkedQuotationId = order.quotationId;
  const linkedQuotationCustomerId = order.quotation?.customerId ?? null;
  const incomingCustomerId = normalizeId(draft.header?.customerId ?? null);
  const incomingQuotationId = normalizeId(draft.header?.quotationId ?? null);

  let nextQuotationId = incomingQuotationId;
  let nextSourceType = draft.header?.sourceType ?? order.sourceType;
  let nextIsConvertedFromQuotation =
    draft.header?.isConvertedFromQuotation ?? order.isConvertedFromQuotation;

  const isSameLinkedQuotation = Boolean(
    linkedQuotationId && incomingQuotationId === linkedQuotationId,
  );

  if (
    isSameLinkedQuotation &&
    incomingCustomerId !== linkedQuotationCustomerId
  ) {
    nextQuotationId = null;
    nextSourceType = "DIRECT";
    nextIsConvertedFromQuotation = false;
  }

  const nextDraft: SalesOrderDraftData = {
    ...draft,
    header: {
      ...draft.header,
      quotationId: nextQuotationId,
      sourceType: nextSourceType,
      isConvertedFromQuotation: nextIsConvertedFromQuotation,
    },
  };

  const shouldRevertLinkedQuotation = Boolean(
    linkedQuotationId && linkedQuotationId !== nextQuotationId,
  );

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldRevertLinkedQuotation && order.quotation) {
      const revertQuotationStatus = order.quotation.nextFollowupAt
        ? "FOLLOWUP"
        : "SENT";

      await tx.quotation.update({
        where: { id: order.quotation.id },
        data: {
          status: revertQuotationStatus,
          convertedToOrderAt: null,
          updatedById: session.user.id,
        },
      });
    }

    return tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        draftData: nextDraft as unknown as Prisma.InputJsonValue,
        draftVersion: { increment: 1 },
        quotationId: nextQuotationId,
        sourceType: nextSourceType,
        isConvertedFromQuotation: nextIsConvertedFromQuotation,
        updatedById: session.user.id,
      },
      select: {
        draftVersion: true,
        updatedAt: true,
      },
    });
  });

  return {
    ok: true as const,
    serverVersion: updated.draftVersion,
    savedAt: updated.updatedAt.toISOString(),
  };
};
