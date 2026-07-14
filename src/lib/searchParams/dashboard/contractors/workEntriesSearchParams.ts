import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";

export const WorkEntrySort = ["date", "createdAt", "amount", "qty"];
export const SortDir = ["asc", "desc"];

export const workEntriesParsers = {
  q: parseAsString.withDefault(""),
  workerId: parseAsString.withDefault(""),
  contractorRateId: parseAsString.withDefault(""),
  monthYear: parseAsString.withDefault(""), // YYYY-MM
  from: parseAsString.withDefault(""), // ISO date
  to: parseAsString.withDefault(""),
  sort: parseAsStringEnum(WorkEntrySort).withDefault("date"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(50),
};

export const workEntriesSearchParamsCache = createSearchParamsCache(workEntriesParsers);

export type WorkEntriesQP = Awaited<ReturnType<typeof workEntriesSearchParamsCache.parse>>;
