import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const CastingMasterStatus = ["ALL", "ACTIVE", "INACTIVE"];
export const CastingMasterSort = [
  "createdAt",
  "castingItemName",
  "castingCode",
  "updatedAt",
];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

export const castingMastersParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(CastingMasterStatus).withDefault("ALL"),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
  sort: parseAsStringEnum(CastingMasterSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const castingMastersSearchParamsCache =
  createSearchParamsCache(castingMastersParsers);

export type CastingMastersQP = Awaited<
  ReturnType<typeof castingMastersSearchParamsCache.parse>
>;
