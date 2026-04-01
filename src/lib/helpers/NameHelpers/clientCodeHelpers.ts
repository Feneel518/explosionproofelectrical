export function getClientCode(name?: string | null): string {
  if (!name) return "-";

  const ignore = ["pvt", "ltd", "private", "limited", "company", "co", "and"];

  return name
    .trim()
    .split(/\s+/)
    .filter((word) => !ignore.includes(word.toLowerCase()))
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
