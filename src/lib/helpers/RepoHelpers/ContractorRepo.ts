import { Prisma, WorkerRole } from "@prisma/client";
import { WorkersQP } from "@/lib/searchParams/dashboard/contractors/workersSearchParams";
import { WorkEntriesQP } from "@/lib/searchParams/dashboard/contractors/workEntriesSearchParams";
import { RateCatalogQP } from "@/lib/searchParams/dashboard/contractors/rateCatalogSearchParams";
import { PayoutsQP } from "@/lib/searchParams/dashboard/contractors/payoutsSearchParams";

// =====================
// Workers
// =====================
export const buildWorkerWhere = (qp: WorkersQP): Prisma.WorkerWhereInput => {
  const and: Prisma.WorkerWhereInput[] = [];

  if (qp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (qp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  if (qp.q) {
    and.push({
      OR: [
        { name: { contains: qp.q, mode: "insensitive" } },
        { code: { contains: qp.q, mode: "insensitive" } },
        { phone: { contains: qp.q, mode: "insensitive" } },
        { email: { contains: qp.q, mode: "insensitive" } },
      ],
    });
  }

  if (qp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (qp.status === "INACTIVE") and.push({ status: "INACTIVE" });

  if (qp.role !== "ALL") and.push({ role: qp.role as WorkerRole });

  return { AND: and };
};

export const buildWorkerOrderBy = (qp: WorkersQP): Prisma.WorkerOrderByWithRelationInput => {
  const dir = qp.dir as "asc" | "desc";
  switch (qp.sort) {
    case "name":
      return { name: dir };
    case "code":
      return { code: dir };
    case "role":
      return { role: dir };
    case "status":
      return { status: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
};

export const buildRateWhere = (qp: RateCatalogQP): Prisma.ContractorRateWhereInput => {
  const and: Prisma.ContractorRateWhereInput[] = [{ deletedAt: null }];

  if (qp.q) {
    and.push({
      OR: [
        {
          contractorProduct: {
            name: { contains: qp.q, mode: "insensitive" },
          },
        },
        {
          contractorOperation: {
            name: { contains: qp.q, mode: "insensitive" },
          },
        },
        { sideLabel: { contains: qp.q, mode: "insensitive" } },
        { notes: { contains: qp.q, mode: "insensitive" } },
      ],
    });
  }

  if (qp.productId) and.push({ contractorProductId: qp.productId });
  if (qp.operationId) and.push({ contractorOperationId: qp.operationId });
  if (qp.status === "ACTIVE") and.push({ status: "ACTIVE" });
  if (qp.status === "INACTIVE") and.push({ status: "INACTIVE" });
  if (qp.role !== "ALL") and.push({ role: qp.role as WorkerRole });

  return { AND: and };
};

export const buildRateOrderBy = (
  qp: RateCatalogQP,
): Prisma.ContractorRateOrderByWithRelationInput[] => {
  const dir = qp.dir as "asc" | "desc";
  switch (qp.sort) {
    case "product":
      return [{ contractorProduct: { name: dir } }, { contractorOperation: { name: dir } }];
    case "operation":
      return [{ contractorOperation: { name: dir } }, { contractorProduct: { name: dir } }];
    case "rate":
      return [{ defaultRate: dir }, { createdAt: "desc" }];
    case "createdAt":
    default:
      return [{ createdAt: dir }];
  }
};

// =====================
// Work Entries
// =====================
export const buildWorkEntryWhere = (qp: WorkEntriesQP): Prisma.WorkEntryWhereInput => {
  const and: Prisma.WorkEntryWhereInput[] = [{ deletedAt: null }];

  if (qp.q) {
    and.push({
      OR: [
        { productNameSnapshot: { contains: qp.q, mode: "insensitive" } },
        { operationNameSnapshot: { contains: qp.q, mode: "insensitive" } },
        { sideLabelSnapshot: { contains: qp.q, mode: "insensitive" } },
        { notes: { contains: qp.q, mode: "insensitive" } },
        { worker: { name: { contains: qp.q, mode: "insensitive" } } },
      ],
    });
  }

  if (qp.workerId) and.push({ workerId: qp.workerId });
  if (qp.contractorRateId) and.push({ contractorRateId: qp.contractorRateId });

  // Month-Year filter (YYYY-MM)
  if (qp.monthYear && /^\d{4}-\d{2}$/.test(qp.monthYear)) {
    const [yy, mm] = qp.monthYear.split("-").map(Number);
    const start = new Date(yy, mm - 1, 1);
    const end = new Date(yy, mm, 1);
    and.push({ date: { gte: start, lt: end } });
  }

  if (qp.from) {
    const d = new Date(qp.from);
    if (!isNaN(d.getTime())) and.push({ date: { gte: d } });
  }
  if (qp.to) {
    const d = new Date(qp.to);
    if (!isNaN(d.getTime())) and.push({ date: { lte: d } });
  }

  return { AND: and };
};

export const buildWorkEntryOrderBy = (
  qp: WorkEntriesQP,
): Prisma.WorkEntryOrderByWithRelationInput => {
  const dir = qp.dir as "asc" | "desc";
  switch (qp.sort) {
    case "amount":
      return { amount: dir };
    case "qty":
      return { qty: dir };
    case "createdAt":
      return { createdAt: dir };
    case "date":
    default:
      return { date: dir };
  }
};

export const buildPayoutWhere = (qp: PayoutsQP): Prisma.WorkerPayoutWhereInput => {
  const and: Prisma.WorkerPayoutWhereInput[] = [];

  if (qp.workerId) and.push({ workerId: qp.workerId });
  if (qp.monthYear) and.push({ monthYear: qp.monthYear });

  return { AND: and };
};

export const buildPayoutOrderBy = (
  qp: PayoutsQP,
): Prisma.WorkerPayoutOrderByWithRelationInput => {
  const dir = qp.dir as "asc" | "desc";
  switch (qp.sort) {
    case "createdAt":
      return { createdAt: dir };
    case "netPayable":
      return { netPayable: dir };
    case "amountPaid":
      return { amountPaid: dir };
    case "monthYear":
    default:
      return { monthYear: dir };
  }
};
