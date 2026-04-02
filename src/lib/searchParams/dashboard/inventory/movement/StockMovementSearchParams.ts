import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const STOCK_MOVEMENT_TYPES = [
  "ALL",
  "IN",
  "OUT",
  "RETURN_IN",
  "RETURN_OUT",
  "ADJUST_IN",
  "ADJUST_OUT",
  "SCRAP_OUT",
] as const;

export const STOCK_REFERENCE_TYPES = [
  "ALL",
  "GRN",
  "MATERIAL_ISSUE",
  "CASTING_JOB",
  "MANUAL_ADJUSTMENT",
] as const;

export const STOCK_ISSUE_TYPES = ["ALL", "INTERNAL_USE", "DIRECT_SALE"] as const;

export const STOCK_MOVEMENT_SORTS = [
  "movementDate",
  "movementType",
  "referenceType",
  "actorName",
  "balanceAfter",
] as const;

export const stockMovementParsers = {
  q: parseAsString.withDefault(""),
  movementType: parseAsStringEnum([...STOCK_MOVEMENT_TYPES]).withDefault("ALL"),
  referenceType: parseAsStringEnum([...STOCK_REFERENCE_TYPES]).withDefault("ALL"),
  issueType: parseAsStringEnum([...STOCK_ISSUE_TYPES]).withDefault("ALL"),
  sort: parseAsStringEnum([...STOCK_MOVEMENT_SORTS]).withDefault("movementDate"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
};

export const stockMovementSearchParamsCache =
  createSearchParamsCache(stockMovementParsers);

export type StockMovementQP = Awaited<
  ReturnType<typeof stockMovementSearchParamsCache.parse>
>;
