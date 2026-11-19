type TechnicalData = {
  name?: string;
  flpType?: string | null;
  protection?: string | null;
  gasGroup?: string | null;
  zones?: string[];
  category?: { name: string };
};

export function isNonHazardousProduct(data: TechnicalData) {
  return /\bnon[\s-]*(?:flp|flameproof)\b/i.test(`${data.name ?? ""} ${data.category?.name ?? ""}`) || /^petcoke$/i.test(data.name?.trim() ?? "");
}

export function isZoneZero(zone: string) {
  return /^zone[\s-]*0$/i.test(zone.trim());
}

export function supportsZoneZero(data: TechnicalData) {
  // Never infer Ga suitability from gas group, IP rating or a generic FLP label.
  return /\bEx\s+da\b|\bGa\b/i.test(data.flpType ?? "");
}

export function technicalDataIssues(data: TechnicalData) {
  const issues: string[] = [];
  if (isNonHazardousProduct(data) && (data.zones?.length || data.gasGroup)) {
    issues.push("A non-FLP or non-electrical product must not inherit hazardous-zone or gas-group declarations.");
  }
  if (data.zones?.some(isZoneZero) && !supportsZoneZero(data)) {
    issues.push("Zone 0 requires a documented Ga / Ex da marking; confirm the product certificate before publishing this declaration.");
  }
  if (/IP[\s-]*\d+/i.test(data.protection ?? "") && /60079[\s:-]*1\b/.test(data.protection ?? "")) {
    issues.push("IEC 60079-1 concerns flameproof protection. Verify the IP rating separately against the ingress-protection documentation.");
  }
  return issues;
}

export function publishedZones(data: TechnicalData) {
  if (isNonHazardousProduct(data)) return [];
  return [...new Set((data.zones ?? []).filter(zone => !isZoneZero(zone) || supportsZoneZero(data)))];
}

export function protectionConcept(marking?: string | null) {
  return marking?.match(/\bEx\s+(?:d[abc]?|e[bc]?|i[abc]|p[xyz][bc]?|t[abc])\b/i)?.[0];
}

export function gasGroupLabel(value?: string | null) {
  // Preserve restricted IIB + H2 markings instead of broadening them to IIC.
  const groups = [...new Set((value?.match(/\bII[ABC]\b/gi) ?? []).map(group => group.toUpperCase()))];
  const hydrogen = /IIB\s*(?:\+|plus|and|&)\s*(?:H[₂2]|hydrogen)/i.test(value ?? "");
  return groups.map(group => group === "IIB" && hydrogen ? "IIB + H2" : group).join("/");
}

export function safeTechnicalDescription(text: string | null | undefined, data: TechnicalData) {
  if (isNonHazardousProduct(data) && /zone[\s-]*\d|\bEx\s+d|gas group/i.test(text ?? "")) return undefined;
  if (!supportsZoneZero(data) && /zone[\s-]*0\b/i.test(text ?? "")) return undefined;
  return text?.trim() || undefined;
}
