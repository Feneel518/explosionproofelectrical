export function buildContractorRateLabel(input: {
  productName: string;
  operationName: string;
  sideLabel?: string | null;
}) {
  return [input.productName, input.sideLabel, input.operationName]
    .filter((value) => value && String(value).trim())
    .join(" / ");
}

export function formatMonthYearLabel(monthYear: string) {
  if (!/^\d{4}-\d{2}$/.test(monthYear)) return monthYear;
  const [year, month] = monthYear.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
