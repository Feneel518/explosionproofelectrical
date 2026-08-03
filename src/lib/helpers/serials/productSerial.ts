export function normalizeSerialPrefix(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatProductSerial(
  prefix: string,
  year: number,
  sequence: number,
) {
  return `EXEC-${normalizeSerialPrefix(prefix)}-${String(year).slice(-2)}-${String(sequence).padStart(5, "0")}`;
}
