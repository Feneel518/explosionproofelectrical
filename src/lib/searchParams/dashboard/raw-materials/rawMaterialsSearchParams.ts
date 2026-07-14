import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const RawMaterialStatus = ["ALL", "ACTIVE", "INACTIVE"];
export const RawMaterialSort = [
  "createdAt",
  "companyItemName",
  "itemCode",
  "updatedAt",
];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

export const rawMaterialsParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(RawMaterialStatus).withDefault("ALL"),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
  sort: parseAsStringEnum(RawMaterialSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const rawMaterialsSearchParamsCache =
  createSearchParamsCache(rawMaterialsParsers);

export type RawMaterialsQP = Awaited<
  ReturnType<typeof rawMaterialsSearchParamsCache.parse>
>;
