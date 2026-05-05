import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const ContractorCatalogStatusOptions = ["ALL", "ACTIVE", "INACTIVE"];
export const ContractorRoleFilterOptions = [
  "ALL",
  "TURNER",
  "ASSEMBLY",
  "POLISHING",
  "PAINTING",
  "HELPER",
  "OTHER",
];
export const RateCatalogSort = ["createdAt", "product", "operation", "rate"];
export const SortDir = ["asc", "desc"];

export const rateCatalogParsers = {
  q: parseAsString.withDefault(""),
  productId: parseAsString.withDefault(""),
  operationId: parseAsString.withDefault(""),
  status: parseAsStringEnum(ContractorCatalogStatusOptions).withDefault("ALL"),
  role: parseAsStringEnum(ContractorRoleFilterOptions).withDefault("ALL"),
  sort: parseAsStringEnum(RateCatalogSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
};

export const rateCatalogSearchParamsCache =
  createSearchParamsCache(rateCatalogParsers);

export type RateCatalogQP = Awaited<
  ReturnType<typeof rateCatalogSearchParamsCache.parse>
>;
