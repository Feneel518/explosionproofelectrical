"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export type SalesDocumentKind = "quotation" | "order" | "invoice";

export type DocumentPreviewItem = {
  title: string;
  typeNumber: string | null;
  sku: string | null;
  qty: number;
  unit: string | null;
};

function itemsFromDraft(value: unknown): DocumentPreviewItem[] | null {
  let draft = value;
  if (typeof draft === "string") {
    try {
      draft = JSON.parse(draft);
    } catch {
      return null;
    }
  }
  if (!draft || typeof draft !== "object" || !("items" in draft)) return null;
  const items = draft.items;
  if (!Array.isArray(items)) return null;

  return items.map((item) => ({
    title: typeof item?.title === "string" ? item.title : "Untitled item",
    typeNumber: typeof item?.typeNumber === "string" ? item.typeNumber : null,
    sku: typeof item?.sku === "string" ? item.sku : null,
    qty: Number(item?.qty) || 0,
    unit: typeof item?.unit === "string" ? item.unit : null,
  }));
}

export async function getDocumentItemsPreviewAction(
  kind: SalesDocumentKind,
  id: string,
): Promise<{ ok: true; items: DocumentPreviewItem[] } | { ok: false }> {
  await requireAuth();
  if (!id) return { ok: false };

  if (kind === "quotation") {
    const record = await prisma.quotation.findUnique({
      where: { id },
      select: {
        status: true,
        draftData: true,
        items: {
          orderBy: { sortOrder: "asc" },
          select: { title: true, typeNumber: true, sku: true, qty: true, unit: true },
        },
      },
    });
    if (!record) return { ok: false };
    return {
      ok: true,
      items: (record.status === "DRAFT" && itemsFromDraft(record.draftData)) || record.items,
    };
  }

  if (kind === "order") {
    const record = await prisma.salesOrder.findUnique({
      where: { id },
      select: {
        status: true,
        draftData: true,
        items: {
          orderBy: { sortOrder: "asc" },
          select: { title: true, typeNumber: true, sku: true, qty: true, unit: true },
        },
      },
    });
    if (!record) return { ok: false };
    return {
      ok: true,
      items: (record.status === "DRAFT" && itemsFromDraft(record.draftData)) || record.items,
    };
  }

  if (kind === "invoice") {
    const record = await prisma.invoice.findUnique({
      where: { id },
      select: {
        status: true,
        draftData: true,
        items: {
          orderBy: { sortOrder: "asc" },
          select: { title: true, typeNumber: true, sku: true, qty: true, unit: true },
        },
      },
    });
    if (!record) return { ok: false };
    return {
      ok: true,
      items: (record.status === "DRAFT" && itemsFromDraft(record.draftData)) || record.items,
    };
  }

  return { ok: false };
}
