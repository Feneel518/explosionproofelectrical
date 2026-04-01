import {
  getFinancialYearLabelFromStartYear,
  getFinancialYearStartYear,
} from "@/lib/helpers/globalHelpers/financialYear";
import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const QUOTATION_STATUSES = [
  "ALL",
  "DRAFT",
  "SENT",
  "FOLLOWUP",
  "WON",
  "LOST",
  "EXPIRED",
  "CANCELLED",
];
export const LEAD_PLATFORMS = [
  "ALL",
  "WHATSAPP",
  "PHONE_CALL",
  "REDIFFMAIL",
  "INFO",
  "SALES1",
  "EECMINES",
  "WEBSITE",
  "INDIA_MART",
  "TRADE_INDIA",
  "DIRECT_VISIT",
  "REFERENCE",
  "OTHER",
];

export const QUOTATION_FOLLOWUPS = ["ALL", "OVERDUE", "TODAY", "UPCOMING"];

export const QUOTATION_SORTS = [
  "createdAt",
  "updatedAt",
  "quoteNo",
  "nextFollowupAt",
];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

// ✅ share this with client
export const quotationParsers = {
  q: parseAsString.withDefault(""),

  status: parseAsStringEnum(QUOTATION_STATUSES).withDefault("ALL"),
  platform: parseAsStringEnum(LEAD_PLATFORMS).withDefault("ALL"),

  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  customerId: parseAsString.withDefault(""),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),

  followUp: parseAsStringEnum(QUOTATION_FOLLOWUPS).withDefault("ALL"),

  // Helpers
  hasCustomer: parseAsBoolean, // null when not present
  needsFollowup: parseAsBoolean,
  followupOverdue: parseAsBoolean,

  // Dates (ISO strings)
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),

  sort: parseAsStringEnum(QUOTATION_SORTS).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),

  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),

  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
};

export const quotationSearchParamsCache =
  createSearchParamsCache(quotationParsers);

export type QuotationQP = Awaited<
  ReturnType<typeof quotationSearchParamsCache.parse>
>;
