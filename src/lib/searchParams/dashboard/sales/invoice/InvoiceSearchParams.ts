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

export const INVOICE_STATUSES = ["ALL", "DRAFT", "FINALIZED", "CANCELLED"];

export const INVOICE_SORTS = [
  "createdAt",
  "invoiceDate",
  "invoiceNo",
  "grandTotal",
  "clientNameSnapshot",
  "status",
];

export const invoiceParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringEnum(INVOICE_STATUSES).withDefault("ALL"),
  fy: parseAsString.withDefault(
    getFinancialYearLabelFromStartYear(getFinancialYearStartYear()),
  ),
  year: parseAsInteger.withDefault(getFinancialYearStartYear()),
  customerId: parseAsString.withDefault(""),
  salesOrderId: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  sort: parseAsStringEnum(INVOICE_SORTS).withDefault("createdAt"),
  dir: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const invoiceSearchParamsCache = createSearchParamsCache(invoiceParsers);

export type InvoiceQP = Awaited<
  ReturnType<typeof invoiceSearchParamsCache.parse>
>;
