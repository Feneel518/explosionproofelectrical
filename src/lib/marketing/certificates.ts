/**
 * Certification and approval bodies shown on the public site.
 *
 * Add certificate numbers, validity and document links per body as they are
 * confirmed — the homepage and /certifications render whatever is filled in
 * here and fall back to "available on request" when a field is empty.
 */
export type CertificateRecord = {
  /** e.g. "CIMFR/TC/12345" */
  number: string;
  /** What the certificate covers, e.g. product family or type numbers. */
  scope: string;
  /** e.g. "Valid to Mar 2029" */
  validity?: string;
  /** Public URL of a scan or PDF, if you want it downloadable. */
  documentUrl?: string;
};

export type CertificationBody = {
  key: "cimfr" | "peso";
  short: string;
  name: string;
  location: string;
  role: string;
  summary: string;
  covers: string[];
  certificates: CertificateRecord[];
};

export const certificationBodies: CertificationBody[] = [
  {
    key: "cimfr",
    short: "CIMFR",
    name: "CSIR – Central Institute of Mining & Fuel Research",
    location: "Dhanbad, India",
    role: "Testing & certification",
    summary: "Flameproof enclosures are type-tested by CIMFR — explosion, flame-transmission, ingress and thermal tests against the applicable IS/IEC 60079 standards.",
    covers: ["Ex d flameproof enclosure design", "Gas group and temperature class", "Ingress protection (IP) tests"],
    certificates: [],
  },
  {
    key: "peso",
    short: "PESO",
    name: "Petroleum & Explosives Safety Organisation",
    location: "Nagpur, India",
    role: "Statutory approval",
    summary: "PESO grants the statutory approval for electrical equipment installed in petroleum and explosives hazardous areas, based on the tested and certified design.",
    covers: ["Approval for use in hazardous areas", "Covered models and type numbers", "Conditions of use"],
    certificates: [],
  },
];

export const certificateChecklist = [
  "Manufacturer name, certificate number and covered type numbers",
  "Full Ex marking, gas group and permitted zones",
  "Temperature class, ambient range and electrical ratings",
  "Validity and the conditions of use",
];
