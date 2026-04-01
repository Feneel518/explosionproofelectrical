import {
  getFinancialYearLabelFromStartYear,
  getFinancialYearStartYear,
} from "@/lib/helpers/globalHelpers/financialYear";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const SALES_ORDER_STATUSES = [
  "ALL",
  "DRAFT",
  "CONFIRMED",
  "IN_PRODUCTION",
  "PARTIALLY_DISPATCHED",
  "DISPATCHED",
  "PARTIALLY_INVOICED",
  "INVOICED",
  "COMPLETED",
  "CANCELLED",
];

export const SALES_ORDER_SOURCE_TYPES = [
  "ALL",
  "DIRECT",
  "QUOTATION",
  "MANUAL",
  "IMPORTED",
];

export const ORDER_SORTS = [
  "createdAt",
  "orderDate",
  "orderNo",
  "grandTotal",
  "clientNameSnapshot",
  "status",
];

export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

export const orderParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(SALES_ORDER_STATUSES).withDefault("ALL"),
  sourceType: parseAsStringEnum(SALES_ORDER_SOURCE_TYPES).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  customerId: parseAsString.withDefault(""),
  quotationId: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
  sort: parseAsStringEnum(ORDER_SORTS).withDefault("createdAt"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const orderSearchParamsCache = createSearchParamsCache(orderParsers);

export type OrderQP = Awaited<ReturnType<typeof orderSearchParamsCache.parse>>;
