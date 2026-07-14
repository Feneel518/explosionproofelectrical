import {
  getFinancialYearLabelFromStartYear,
  getFinancialYearStartYear,
} from "@/lib/helpers/globalHelpers/financialYear";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const CASTING_JOB_STATUSES = [
  "ALL",
  "DRAFT",
  "IN_PROGRESS",
  "PARTIAL_RECEIVED",
  "CLOSED",
  "CANCELLED",
] as const;

export const CASTING_JOB_WORKER_TYPES = [
  "ALL",
  "IN_HOUSE",
  "JOB_WORK",
  "CONTRACT",
] as const;

export const CASTING_JOB_SORTS = [
  "createdAt",
  "issueDate",
  "jobNo",
  "workerNameSnapshot",
  "totalPendingWeightKg",
] as const;

export const castingJobParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum([...CASTING_JOB_STATUSES]).withDefault("ALL"),
  workerType: parseAsStringEnum([...CASTING_JOB_WORKER_TYPES]).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  sort: parseAsStringEnum([...CASTING_JOB_SORTS]).withDefault("createdAt"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const castingJobSearchParamsCache =
  createSearchParamsCache(castingJobParsers);

export type CastingJobQP = Awaited<
  ReturnType<typeof castingJobSearchParamsCache.parse>
>;
