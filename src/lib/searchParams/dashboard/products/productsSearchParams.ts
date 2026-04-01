import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";

export const ProductStatus = ["ALL", "ACTIVE", "INACTIVE"];
export const ProductSort = ["createdAt", "name", "status"];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

// ✅ share this with client
export const ProductsParsers = {
  q: parseAsString.withDefault(""),

  categoryId: parseAsString.withDefault("ALL"),

  status: parseAsStringEnum(ProductStatus).withDefault("ALL"),

  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),

  sort: parseAsStringEnum(ProductSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),

  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const ProductsSearchParamsCache =
  createSearchParamsCache(ProductsParsers);

export type ProductsQP = Awaited<
  ReturnType<typeof ProductsSearchParamsCache.parse>
>;
