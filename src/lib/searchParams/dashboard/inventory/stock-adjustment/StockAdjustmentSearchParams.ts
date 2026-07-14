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

export const STOCK_ADJUSTMENT_STATUSES = [
  "ALL",
  "DRAFT",
  "FINALIZED",
  "CANCELLED",
] as const;

export const STOCK_ADJUSTMENT_SORTS = [
  "adjustDate",
  "adjustNo",
  "adjustedByNameSnapshot",
  "status",
  "createdAt",
] as const;

export const stockAdjustmentParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum([...STOCK_ADJUSTMENT_STATUSES]).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  sort: parseAsStringEnum([...STOCK_ADJUSTMENT_SORTS]).withDefault("adjustDate"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
};

export const stockAdjustmentSearchParamsCache =
  createSearchParamsCache(stockAdjustmentParsers);

export type StockAdjustmentQP = Awaited<
  ReturnType<typeof stockAdjustmentSearchParamsCache.parse>
>;
