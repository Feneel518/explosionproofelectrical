import { GrnQP } from "@/lib/searchParams/dashboard/purchase/grn/GrnSearchParams";
import { Prisma } from "@prisma/client";

export function buildGrnWhere(sp: GrnQP): Prisma.GoodsReceiptNoteWhereInput {
  const and: Prisma.GoodsReceiptNoteWhereInput[] = [];

  if (sp.q) {
    and.push({
      OR: [
        { supplierNameSnapshot: { contains: sp.q, mode: "insensitive" } },
        { supplierInvoiceNo: { contains: sp.q, mode: "insensitive" } },
      ],
    });
  }

  if (sp.status !== "ALL") {
    and.push({ status: sp.status as any });
  }

  if (sp.fy) {
    and.push({ grnFy: sp.fy });
  }

  return and.length ? { AND: and } : {};
}

type GrnOrderBy =
  | Prisma.GoodsReceiptNoteOrderByWithRelationInput
  | Prisma.GoodsReceiptNoteOrderByWithRelationInput[];

export function buildGrnOrderBy(sp: GrnQP): GrnOrderBy {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "receivedAt":
      return { receivedAt: dir };
    case "grnNo":
      return [{ grnFy: dir }, { grnNo: dir }];
    case "supplierNameSnapshot":
      return { supplierNameSnapshot: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

