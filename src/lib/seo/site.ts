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

export function organizationSchema() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME, alternateName: SITE_SHORT_NAME, url: absoluteUrl("/"), logo: absoluteUrl("/marketing/Logo.png"), email: COMPANY_EMAIL, address: { "@type": "PostalAddress", ...COMPANY_ADDRESS }, areaServed: { "@type": "Country", name: "India" }, knowsAbout: ["Flameproof enclosures", "Explosion-proof electrical equipment", "Hazardous-area lighting", "Flameproof junction boxes", "Electrical control panels"] },
    { "@type": "WebSite", "@id": absoluteUrl("/#website"), name: SITE_BRAND, url: absoluteUrl("/"), publisher: { "@id": absoluteUrl("/#organization") }, inLanguage: "en-IN" },
  ] };
}
