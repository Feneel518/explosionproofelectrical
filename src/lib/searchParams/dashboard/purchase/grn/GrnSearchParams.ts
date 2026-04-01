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

export const GRN_STATUSES = ["ALL", "DRAFT", "FINALIZED", "CANCELLED"];
export const GRN_SORTS = [
  "createdAt",
  "receivedAt",
  "grnNo",
  "supplierNameSnapshot",
];

export const grnParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(GRN_STATUSES).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  sort: parseAsStringEnum(GRN_SORTS).withDefault("createdAt"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const grnSearchParamsCache = createSearchParamsCache(grnParsers);
export type GrnQP = Awaited<ReturnType<typeof grnSearchParamsCache.parse>>;
