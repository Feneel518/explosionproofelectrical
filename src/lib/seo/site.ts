export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://www.explosionproofelectrical.com";

export const SITE_NAME = "Explosion Proof Electrical Control";
export const SITE_SHORT_NAME = "ExEC";
export const SITE_BRAND = `${SITE_NAME} (${SITE_SHORT_NAME})`;

export const SITE_TITLE_DEFAULT =
  "Flameproof Manufacturer in India | Explosion Proof Electrical Control";

export const SITE_DESCRIPTION =
  "Explosion Proof Electrical Control (ExEC) is a flameproof and explosion-proof electrical manufacturer in Vapi, Gujarat. We build flameproof junction boxes, panels, well glass fittings, bulkhead lights, and hazardous-area electrical solutions.";

export const SITE_KEYWORDS = [
  "flameproof manufacturer",
  "explosion proof electrical",
  "flameproof junction box",
  "flameproof panel",
  "well glass fitting",
  "bulkhead light",
  "hazardous area lighting",
  "CIMFR certified flameproof products",
  "PESO approved flameproof products",
  "flameproof manufacturer in Vapi",
  "flameproof manufacturer in Gujarat",
  "industrial explosion proof solutions",
];

export const COMPANY_ADDRESS = {
  streetAddress: "Plot No. 920, GIDC, Phase 4",
  addressLocality: "Vapi",
  addressRegion: "Gujarat",
  postalCode: "396195",
  addressCountry: "IN",
};

export const COMPANY_EMAIL = "info@explosionproofelectrical.com";
export const COMPANY_GSTIN = "24AAAFE7591G1ZG";

export function absoluteUrl(path = "/") {
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}
