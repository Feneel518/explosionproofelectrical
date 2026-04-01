import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export type FinancialYearParts = {
  startYear: number; // e.g. 2025
  endYear: number; // e.g. 2026
  label: string; // e.g. "FY2025-26"
  short: string; // e.g. "25-26"
};

const IST_TIMEZONE = "Asia/Kolkata";
export const DOCUMENT_NUMBER_PAD = 3;

function getISTDate(date: Date = new Date()) {
  return toZonedTime(date, IST_TIMEZONE);
}

export function getFinancialYearParts(
  date: Date = new Date(),
): FinancialYearParts {
  const istDate = getISTDate(date);

  const year = Number(format(istDate, "yyyy"));
  const month = Number(format(istDate, "M")); // 1-12

  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;

  const endYY = String(endYear % 100).padStart(2, "0");
  const startYY = String(startYear % 100).padStart(2, "0");

  return {
    startYear,
    endYear,
    label: `FY${startYear}-${endYY}`,
    short: `${startYY}-${endYY}`,
  };
}

export function getFinancialYearLabel(date: Date = new Date()): string {
  return getFinancialYearParts(date).label;
}

export function formatDocumentSerial(
  serial: number | string | null | undefined,
  pad: number = DOCUMENT_NUMBER_PAD,
): string {
  const normalized = Number(serial ?? 0);
  const safe = Number.isFinite(normalized) ? Math.max(0, Math.trunc(normalized)) : 0;
  return String(safe).padStart(pad, "0");
}

export function formatFinancialDocumentNumber(
  fy: string | null | undefined,
  serial: number | string | null | undefined,
  pad: number = DOCUMENT_NUMBER_PAD,
): string {
  const paddedSerial = formatDocumentSerial(serial, pad);
  return fy ? `${fy}-${paddedSerial}` : paddedSerial;
}

export function formatPrefixedFinancialDocumentNumber(
  prefix: string,
  fy: string | null | undefined,
  serial: number | string | null | undefined,
  pad: number = DOCUMENT_NUMBER_PAD,
): string {
  return `${prefix}${formatFinancialDocumentNumber(fy, serial, pad)}`;
}

/**
 * Formats quotation reference
 * Example: EXQN/FY2025-26/007
 */
export function formatQuotationRef(
  quoteFy: string,
  quoteNo: number,
  pad: number = DOCUMENT_NUMBER_PAD,
) {
  return `EXQN/${quoteFy}/${formatDocumentSerial(quoteNo, pad)}`;
}

export function getFinancialYearStartYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 1 = Feb, ... 11 = Dec

  // FY starts in April (month index 3)
  return month >= 3 ? year : year - 1;
}

export function getFinancialYearLabelFromStartYear(startYear: number): string {
  return getFinancialYearLabel(new Date(startYear, 3, 1)); // April 1st of the start year
}
