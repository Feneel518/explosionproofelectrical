import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";

export const WorkerStatusOptions = ["ALL", "ACTIVE", "INACTIVE"];
export const WorkerRoleOptions = [
  "ALL",
  "TURNER",
  "ASSEMBLY",
  "POLISHING",
  "PAINTING",
  "HELPER",
  "OTHER",
];
export const WorkerSort = ["createdAt", "name", "code", "role", "status"];
export const SortDir = ["asc", "desc"];
export const TrashFilter = ["EXCLUDE", "ONLY", "INCLUDE"];

export const workersParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(WorkerStatusOptions).withDefault("ALL"),
  role: parseAsStringEnum(WorkerRoleOptions).withDefault("ALL"),
  sort: parseAsStringEnum(WorkerSort).withDefault("createdAt"),
  dir: parseAsStringEnum(SortDir).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  trash: parseAsStringEnum(TrashFilter).withDefault("EXCLUDE"),
};

export const workersSearchParamsCache = createSearchParamsCache(workersParsers);

export type WorkersQP = Awaited<ReturnType<typeof workersSearchParamsCache.parse>>;
