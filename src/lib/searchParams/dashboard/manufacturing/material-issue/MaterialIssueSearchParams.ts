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

export const MATERIAL_ISSUE_STATUSES = [
  "ALL",
  "DRAFT",
  "FINALIZED",
  "CANCELLED",
];

export const MATERIAL_ISSUE_SORTS = [
  "createdAt",
  "issueDate",
  "issueNo",
  "issuedToNameSnapshot",
];

export const materialIssueParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(MATERIAL_ISSUE_STATUSES).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  sort: parseAsStringEnum(MATERIAL_ISSUE_SORTS).withDefault("createdAt"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const materialIssueSearchParamsCache =
  createSearchParamsCache(materialIssueParsers);
export type MaterialIssueQP = Awaited<
  ReturnType<typeof materialIssueSearchParamsCache.parse>
>;
