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

export const DELIVERY_CHALLAN_STATUSES = [
  "ALL",
  "DRAFT",
  "ISSUED",
  "PARTIALLY_CLOSED",
  "CLOSED",
  "CANCELLED",
];

export const DELIVERY_CHALLAN_TYPES = [
  "ALL",
  "TO_BE_BILLED",
  "JOB_WORK",
  "SAMPLE",
  "RETURNABLE",
];

export const DELIVERY_CHALLAN_SORTS = [
  "createdAt",
  "updatedAt",
  "date",
  "challanNo",
  "status",
  "type",
];

export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

export const deliveryChallanParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(DELIVERY_CHALLAN_STATUSES).withDefault("ALL"),
  type: parseAsStringEnum(DELIVERY_CHALLAN_TYPES).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  customerId: parseAsString.withDefault(""),
  quotationId: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
  sort: parseAsStringEnum(DELIVERY_CHALLAN_SORTS).withDefault("createdAt"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const deliveryChallanSearchParamsCache = createSearchParamsCache(
  deliveryChallanParsers,
);

export type DeliveryChallanQP = Awaited<
  ReturnType<typeof deliveryChallanSearchParamsCache.parse>
>;
