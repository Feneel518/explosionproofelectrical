import {
  DeliveryChallanStatus,
  DeliveryChallanType,
  Prisma,
} from "@prisma/client";
import { DeliveryChallanQP } from "@/lib/searchParams/dashboard/sales/delivery-challan/DeliveryChallanSearchParams";

export function buildDeliveryChallanWhere(
  sp: DeliveryChallanQP,
): Prisma.DeliveryChallanWhereInput {
  const where: Prisma.DeliveryChallanWhereInput = {};

  if (sp.q) {
    where.OR = [
      { challanCode: { contains: sp.q, mode: "insensitive" } },
      { poNumber: { contains: sp.q, mode: "insensitive" } },
      { remarks: { contains: sp.q, mode: "insensitive" } },
      { customer: { companyName: { contains: sp.q, mode: "insensitive" } } },
      { quotation: { clientName: { contains: sp.q, mode: "insensitive" } } },
    ];
  }

  if (sp.status !== "ALL") {
    where.status = sp.status as DeliveryChallanStatus;
  }

  if (sp.type !== "ALL") {
    where.type = sp.type as DeliveryChallanType;
  }

  if (sp.fy) {
    where.challanFy = sp.fy;
  }

  if (sp.customerId) {
    where.customerId = sp.customerId;
  }

  if (sp.quotationId) {
    where.quotationId = sp.quotationId;
  }

  if (sp.dateFrom || sp.dateTo) {
    where.date = {};
    if (sp.dateFrom) where.date.gte = new Date(sp.dateFrom);
    if (sp.dateTo) where.date.lte = new Date(sp.dateTo);
  }

  if (sp.trash === "EXCLUDE") {
    where.deletedAt = null;
  } else if (sp.trash === "ONLY") {
    where.deletedAt = { not: null };
  }

  return where;
}

export function buildDeliveryChallansOrderBy(sp: DeliveryChallanQP) {
  const dir = sp.dir ?? "desc";

  switch (sp.sort) {
    case "challanNo":
      return [
        { challanNo: dir },
        { createdAt: "desc" },
      ] satisfies Prisma.DeliveryChallanOrderByWithRelationInput[];

    case "date":
      return [
        { date: dir },
        { createdAt: "desc" },
      ] satisfies Prisma.DeliveryChallanOrderByWithRelationInput[];

    case "status":
      return [
        { status: dir },
        { createdAt: "desc" },
      ] satisfies Prisma.DeliveryChallanOrderByWithRelationInput[];

    case "type":
      return [
        { type: dir },
        { createdAt: "desc" },
      ] satisfies Prisma.DeliveryChallanOrderByWithRelationInput[];

    case "updatedAt":
      return [
        { updatedAt: dir },
      ] satisfies Prisma.DeliveryChallanOrderByWithRelationInput[];

    case "createdAt":
    default:
      return [
        { createdAt: dir },
      ] satisfies Prisma.DeliveryChallanOrderByWithRelationInput[];
  }
}
