import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const PayoutSort = ["monthYear", "createdAt", "netPayable", "amountPaid"];
export const SortDir = ["asc", "desc"];

export const payoutsParsers = {
  workerId: parseAsString.withDefault(""),
  monthYear: parseAsString.withDefault(""),
  sort: parseAsStringEnum(PayoutSort).withDefault("monthYear"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
};

export const payoutsSearchParamsCache = createSearchParamsCache(payoutsParsers);

export type PayoutsQP = Awaited<ReturnType<typeof payoutsSearchParamsCache.parse>>;
