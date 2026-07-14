export type WebsiteVisitSourceTypeValue =
  | "DIRECT"
  | "ORGANIC_SEARCH"
  | "SOCIAL"
  | "EMAIL"
  | "REFERRAL"
  | "ADS"
  | "INTERNAL"
  | "UNKNOWN";

export type WebsiteVisitDeviceTypeValue =
  | "DESKTOP"
  | "MOBILE"
  | "TABLET"
  | "BOT"
  | "OTHER";

const SOCIAL_HOST_PATTERNS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "t.me",
  "whatsapp.com",
];

const SEARCH_ENGINE_HOST_PATTERNS = [
  "google.",
  "bing.com",
  "yahoo.",
  "duckduckgo.com",
  "yandex.",
  "baidu.com",
];

const EMAIL_HOST_PATTERNS = ["mail.", "outlook.", "gmail.", "yahoo.mail"];

function containsAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

export function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function extractHost(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getSourceLabel(
  sourceType: WebsiteVisitSourceTypeValue,
  sourceHost: string | null | undefined,
) {
  if (sourceType === "DIRECT") return "Direct";
  if (sourceType === "ORGANIC_SEARCH") return "Organic Search";
  if (sourceType === "SOCIAL") return "Social";
  if (sourceType === "EMAIL") return "Email";
  if (sourceType === "ADS") return "Paid Ads";
  if (sourceType === "INTERNAL") return "Internal Navigation";
  if (sourceHost) return sourceHost;
  if (sourceType === "REFERRAL") return "Referral";
  return "Unknown";
}

export function isBotUserAgent(userAgent: string | null) {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  return /(bot|spider|crawler|curl|wget|headless|preview|monitor)/.test(lower);
}

export function detectDeviceType(
  userAgent: string | null,
): WebsiteVisitDeviceTypeValue {
  if (!userAgent) return "OTHER";
  const lower = userAgent.toLowerCase();
  if (isBotUserAgent(lower)) return "BOT";
  if (/(ipad|tablet|playbook|kindle)/.test(lower)) return "TABLET";
  if (/(mobi|android|iphone|ipod|windows phone)/.test(lower)) return "MOBILE";
  if (/(macintosh|windows nt|linux x86_64|x11)/.test(lower)) return "DESKTOP";
  return "OTHER";
}

export function detectBrowser(userAgent: string | null) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("opr/") || ua.includes("opera/")) return "Opera";
  return "Other";
}

export function detectOS(userAgent: string | null) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return "Other";
}

export function classifyVisitSource(input: {
  utmSource: string | null;
  utmMedium: string | null;
  sourceHost: string | null;
  siteHost: string | null;
}): WebsiteVisitSourceTypeValue {
  const utmSource = (input.utmSource || "").toLowerCase();
  const utmMedium = (input.utmMedium || "").toLowerCase();
  const sourceHost = (input.sourceHost || "").toLowerCase();
  const siteHost = (input.siteHost || "").toLowerCase();

  if (utmMedium) {
    if (/(cpc|ppc|paid|ads|ad|display)/.test(utmMedium)) return "ADS";
    if (/(email|newsletter)/.test(utmMedium)) return "EMAIL";
    if (/(social|social-media|social_media)/.test(utmMedium)) return "SOCIAL";
  }

  if (utmSource) {
    if (containsAny(utmSource, SEARCH_ENGINE_HOST_PATTERNS)) return "ORGANIC_SEARCH";
    if (containsAny(utmSource, SOCIAL_HOST_PATTERNS)) return "SOCIAL";
    if (containsAny(utmSource, EMAIL_HOST_PATTERNS)) return "EMAIL";
  }

  if (!sourceHost) return "DIRECT";
  if (siteHost && sourceHost === siteHost) return "INTERNAL";
  if (containsAny(sourceHost, SEARCH_ENGINE_HOST_PATTERNS)) return "ORGANIC_SEARCH";
  if (containsAny(sourceHost, SOCIAL_HOST_PATTERNS)) return "SOCIAL";
  if (containsAny(sourceHost, EMAIL_HOST_PATTERNS)) return "EMAIL";
  return "REFERRAL";
}
