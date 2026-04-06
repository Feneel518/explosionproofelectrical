import { QuotationQP } from "@/lib/searchParams/dashboard/sales/quotation/QuotationSearchParams";
import { LeadPlatform, Prisma, QuotationStatus } from "@prisma/client";

export const buildQuotationWhere = (sp: QuotationQP) => {
  const and: Prisma.QuotationWhereInput[] = [];
  const now = new Date();

  // soft delete filter
  if (sp.trash === "EXCLUDE") and.push({ deletedAt: null });
  if (sp.trash === "ONLY") and.push({ deletedAt: { not: null } });

  // Search
  if (sp.q) {
    const q = sp.q.trim();

    // allow searching by quote no if user types number
    const maybeNo = Number.parseInt(q, 10);
    const isNumber = !Number.isNaN(maybeNo);

    and.push({
      OR: [
        // quote number search
        ...(isNumber ? [{ quoteNo: maybeNo }] : []),

        // strings
        { quoteFy: { contains: q, mode: "insensitive" } },
        { clientName: { contains: q, mode: "insensitive" } },

        { receivedFromName: { contains: q, mode: "insensitive" } },
        { receivedFromPhone: { contains: q, mode: "insensitive" } },
        { receivedFromEmail: { contains: q, mode: "insensitive" } },

        { enquiryMessage: { contains: q, mode: "insensitive" } },

        // customer quick search (optional)
        { customer: { companyName: { contains: q, mode: "insensitive" } } },
        { customer: { companyEmail: { contains: q, mode: "insensitive" } } },
        { customer: { companyPhone: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  // Status filter
  if (sp.status && sp.status !== "ALL") {
    and.push({ status: sp.status as QuotationStatus });
  }

  // Platform filter
  if (sp.platform && sp.platform !== "ALL") {
    and.push({ platform: sp.platform as LeadPlatform });
  }

  if (sp.categoryId && sp.categoryId !== "ALL") {
    and.push({
      items: {
        some: {
          OR: [
            {
              product: {
                categoryId: sp.categoryId,
              },
            },
            {
              variant: {
                product: {
                  categoryId: sp.categoryId,
                },
              },
            },
          ],
        },
      },
    });
  }

  if (sp.followUp === "OVERDUE") {
    and.push({ nextFollowupAt: { not: null, lt: now } });
  }
  if (sp.followUp === "TODAY") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    and.push({ nextFollowupAt: { gte: start, lte: end } });
  }

  if (sp.followUp === "UPCOMING") {
    and.push({ nextFollowupAt: { not: null, gt: now } });
  }

  // FY filter
  if (sp.fy) {
    and.push({ quoteFy: sp.fy });
  }

  // Customer filter
  if (sp.customerId) {
    and.push({ customerId: sp.customerId });
  }

  // Lead vs customer helper
  if (typeof sp.hasCustomer === "boolean") {
    if (sp.hasCustomer) and.push({ customerId: { not: null } });
    else and.push({ customerId: null });
  }

  // Follow-up helpers
  // needsFollowup => nextFollowupAt exists
  if (typeof sp.needsFollowup === "boolean") {
    if (sp.needsFollowup) and.push({ nextFollowupAt: { not: null } });
    else and.push({ nextFollowupAt: null });
  }

  // followupOverdue => nextFollowupAt < now (and exists)
  if (sp.followupOverdue) {
    and.push({
      nextFollowupAt: {
        not: null,
        lt: now,
      },
    });
  }

  // Date range (createdAt)
  if (sp.dateFrom) {
    const d = new Date(sp.dateFrom);
    if (!Number.isNaN(d.getTime())) {
      and.push({ createdAt: { gte: d } });
    }
  }

  if (sp.dateTo) {
    // treat dateTo as end-of-day inclusive
    const d = new Date(sp.dateTo);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      and.push({ createdAt: { lte: d } });
    }
  }

  return { AND: and };
};

export function buildQuotationsOrderBy(qp: QuotationQP) {
  const sp = qp;
  const dir = sp.dir;

  switch (sp.sort) {
    case "updatedAt":
      return { updatedAt: dir };

    case "quoteNo":
      // ✅ IMPORTANT: quoteNo alone is not globally unique; stable sort uses quoteFy + quoteNo
      return [{ quoteFy: "desc" as const }, { quoteNo: dir }];

    case "nextFollowupAt":
      return { nextFollowupAt: dir };

    case "createdAt":
    default:
      return { createdAt: dir };
  }
}
