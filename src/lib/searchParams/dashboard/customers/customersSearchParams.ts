import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";

export const CustomerStatus = ["ALL", "ACTIVE", "INACTIVE"];
export const CustomerSort = ["createdAt", "companyName", "city"];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

// ✅ share this with client
export const customersParsers = {
  q: parseAsString.withDefault(""),
  city: parseAsString.withDefault(""),
  status: parseAsStringEnum(CustomerStatus).withDefault("ALL"),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
  sort: parseAsStringEnum(CustomerSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const customersSearchParamsCache =
  createSearchParamsCache(customersParsers);

export type CustomersQP = Awaited<
  ReturnType<typeof customersSearchParamsCache.parse>
>;
