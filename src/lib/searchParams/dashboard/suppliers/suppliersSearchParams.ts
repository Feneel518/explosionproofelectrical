import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";

export const SupplierStatus = ["ALL", "ACTIVE", "INACTIVE"];
export const SupplierSort = ["createdAt", "companyName", "city"];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

// âœ… share this with client
export const suppliersParsers = {
  q: parseAsString.withDefault(""),
  city: parseAsString.withDefault(""),
  status: parseAsStringEnum(SupplierStatus).withDefault("ALL"),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
  sort: parseAsStringEnum(SupplierSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const suppliersSearchParamsCache =
  createSearchParamsCache(suppliersParsers);

export type SuppliersQP = Awaited<
  ReturnType<typeof suppliersSearchParamsCache.parse>
>;

