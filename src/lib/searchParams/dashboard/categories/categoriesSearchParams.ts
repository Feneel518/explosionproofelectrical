import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";

export const CategoryStatus = ["ALL", "ACTIVE", "INACTIVE"];
export const CategorySort = ["createdAt", "name", "staus"];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

// ✅ share this with client
export const catgeoryParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(CategoryStatus).withDefault("ALL"),
  sort: parseAsStringEnum(CategorySort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
};

export const catgeorySearchParamsCache =
  createSearchParamsCache(catgeoryParsers);

export type catgeoryQP = Awaited<
  ReturnType<typeof catgeorySearchParamsCache.parse>
>;
