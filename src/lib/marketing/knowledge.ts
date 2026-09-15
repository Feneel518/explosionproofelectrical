export type KnowledgeSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type KnowledgeArticle = {
  slug: string;
  title: string;
  shortTitle: string;
  category: "Hazardous areas" | "Protection concepts" | "Equipment selection" | "Compliance";
  description: string;
  answer: string;
  readMinutes: number;
  updatedAt: string;
  sections: KnowledgeSection[];
  faq: { question: string; answer: string }[];
  relatedProductCategory?: string;
  sources: { label: string; url: string }[];
};

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    slug: "what-is-ex-d-flameproof-protection",
    title: "What Is Ex d Flameproof Protection?",
    shortTitle: "Ex d: flameproof protection",
    category: "Protection concepts",
    description: "Understand how a flameproof enclosure contains an internal ignition, and why flamepaths and cable entries are essential to its protection.",
    takeaways: ["How enclosure flamepaths work","What to verify on the certificate","Installation and maintenance essentials"],
    answer: "Ex d is a type of explosion protection in which parts capable of igniting an explosive gas atmosphere are housed inside an enclosure designed to withstand an internal explosion and prevent it from propagating to the surrounding atmosphere.",
    readMinutes: 5,
    updatedAt: "2026-09-12",
    sections: [
      { heading: "How Ex d protection works", paragraphs: ["An Ex d enclosure does not assume that flammable gas can never enter. Instead, its construction accounts for a possible ignition inside the enclosure. The enclosure and its flamepaths are designed so that the event is contained and hot gases are cooled as they pass through the engineered joints.", "That is why covers, threaded entries, fasteners and machined flamepaths are functional safety features—not merely mechanical details."] },
      { heading: "What must be checked", paragraphs: ["The complete equipment marking and certificate schedule must match the installation. Ex d by itself is not a complete selection specification."], bullets: ["Equipment group and gas group", "Equipment protection level or permitted hazardous zone", "Temperature class or maximum surface temperature", "Ambient temperature range", "Ingress protection and environmental suitability", "Approved cable-entry devices and blanking elements"] },
      { heading: "Installation and maintenance", paragraphs: ["Never drill, machine, substitute fasteners or repair a flamepath without an approved engineering and certification basis. Cable glands, stopping plugs and adapters are part of the installation and must be compatible with the equipment certificate, cable and protection concept.", "Selection and maintenance should be performed by competent personnel using the certificate, manufacturer instructions and the applicable edition of the installation standard."] },
    ],
    faq: [
      { question: "Does flameproof mean fireproof?", answer: "No. Flameproof is a defined explosion-protection concept for explosive atmospheres; it is not a general claim that equipment cannot burn or be damaged by fire." },
      { question: "Can an Ex d enclosure be opened in a hazardous area?", answer: "It should not be opened while energized where an explosive atmosphere may be present. Follow the equipment instructions, permit-to-work system and site isolation procedure." },
    ],
    relatedProductCategory: "enclosures",
    sources: [{ label: "IEC 60079-1 — flameproof enclosures ‘d’", url: "https://webstore.iec.ch/en/publication/621" }],
  },
  {
    slug: "zone-0-zone-1-zone-2-hazardous-areas",
    title: "Zone 0, Zone 1 and Zone 2 Explained",
    shortTitle: "Zone 0, Zone 1 & Zone 2",
    category: "Hazardous areas",
    description: "Understand what gas-area zones say about the likelihood of an explosive atmosphere, and how classification informs equipment selection.",
    takeaways: ["The differences between gas zones","Why zone does not measure severity","Inputs for equipment selection"],
    answer: "For gas and vapour hazards, Zone 0 means an explosive atmosphere is present continuously, for long periods or frequently; Zone 1 means it is likely in normal operation; Zone 2 means it is not likely in normal operation and, if it occurs, persists only briefly.",
    readMinutes: 5,
    updatedAt: "2026-09-12",
    sections: [
      { heading: "The zones describe probability—not severity", paragraphs: ["A lower zone number does not mean a larger explosion. It indicates how likely an explosive gas atmosphere is to be present and for how long. The classification belongs to the location, while the equipment marking states where the equipment may be used."] },
      { heading: "A practical comparison", paragraphs: ["Zone classification is produced from the release source, ventilation and process conditions. Typical examples are only illustrations and cannot replace a documented area-classification study."], bullets: ["Zone 0: inside certain vessels or spaces where a flammable atmosphere is continuously or frequently present", "Zone 1: near a release point where a flammable atmosphere can occur during normal operation", "Zone 2: surrounding areas where a flammable atmosphere is normally absent and any occurrence is short-lived"] },
      { heading: "Selecting equipment for a zone", paragraphs: ["Zone is only one input. Gas group, temperature class, ambient range, protection concept and environmental rating also have to match. Always verify the full marking and certificate rather than selecting from the zone label alone."] },
    ],
    faq: [
      { question: "Is Zone 2 always safe?", answer: "No. Zone 2 is still a classified hazardous area and requires appropriately selected, installed and maintained equipment." },
      { question: "Who decides the zone classification?", answer: "The owner or operator normally arranges a hazardous-area classification by competent specialists using the process materials, release sources, ventilation and applicable standards." },
    ],
    sources: [{ label: "PESO — approval of Ex electrical apparatus", url: "https://www.peso.gov.in/sites/default/files/2023-09/Approval_of_Ex_Electrical_Equipment_Approvals_26-09-23.pdf" }],
  },
  {
    slug: "iia-iib-iic-gas-groups",
    title: "What Is the Difference Between IIA, IIB and IIC?",
    shortTitle: "Gas groups: IIA, IIB & IIC",
    category: "Hazardous areas",
    description: "Read the gas subgroup on an Ex marking and understand why group, temperature class and protection level must be checked together.",
    takeaways: ["The gas-group hierarchy","Limits of an IIC marking","Special gas-group restrictions"],
    answer: "IIA, IIB and IIC are subdivisions used for Group II equipment in explosive gas atmospheres. IIC represents the most demanding subgroup; equipment certified for IIC generally covers IIB and IIA, subject to the complete certificate and marking.",
    readMinutes: 4,
    updatedAt: "2026-09-12",
    sections: [
      { heading: "Why gases are grouped", paragraphs: ["Different gas mixtures have different ignition and flame-transmission characteristics. Grouping lets equipment be designed and assessed against representative levels of risk instead of treating every substance as a separate equipment category."] },
      { heading: "Reading the hierarchy", paragraphs: ["For Group II gas atmospheres, IIA is less demanding than IIB, and IIB is less demanding than IIC from an equipment-construction perspective. A familiar substance example may help orientation, but the site’s verified material data and classification documentation must control the selection."], bullets: ["IIA equipment is limited to IIA applications", "IIB equipment generally covers IIB and IIA", "IIC equipment generally covers IIC, IIB and IIA", "The rest of the Ex marking must also be suitable"] },
      { heading: "Gas group is not temperature class", paragraphs: ["Gas group concerns ignition and flame-transmission characteristics. Temperature class limits equipment surface temperature. Both appear in a complete equipment selection and neither substitutes for the other."] },
    ],
    faq: [
      { question: "Is IIC equipment automatically suitable for every hazardous area?", answer: "No. Its zone or EPL, temperature class, ambient range, protection concept and certificate conditions must also be suitable." },
      { question: "Is IIB plus hydrogen the same as IIC?", answer: "Treat any special marking exactly as stated in its certificate. A restricted approval should not be presented or selected as an unrestricted IIC approval." },
    ],
    sources: [{ label: "IEC 60079 series overview", url: "https://www.iec.ch/dyn/www/f?p=103:7:0::::FSP_ORG_ID:1252" }],
  },
  {
    slug: "temperature-classes-t1-to-t6",
    title: "T1 to T6 Temperature Classes Explained",
    shortTitle: "Temperature classes T1?T6",
    category: "Hazardous areas",
    description: "Decode the surface-temperature limits from T1 to T6, and understand how ambient conditions affect the equipment rating.",
    takeaways: ["The T1?T6 temperature limits","Surface temperature versus ambient","Conditions behind the rating"],
    answer: "A temperature class states the equipment’s maximum permitted surface temperature under its rated conditions. T1 corresponds to 450°C, T2 to 300°C, T3 to 200°C, T4 to 135°C, T5 to 100°C and T6 to 85°C.",
    readMinutes: 4,
    updatedAt: "2026-09-12",
    sections: [
      { heading: "The temperature-class table", paragraphs: ["The selected equipment must remain below the ignition temperature required for the explosive atmosphere, with the margin and method required by the applicable standard and site design."], bullets: ["T1 — 450°C", "T2 — 300°C", "T3 — 200°C", "T4 — 135°C", "T5 — 100°C", "T6 — 85°C"] },
      { heading: "Why T6 is more restrictive", paragraphs: ["The sequence can feel counter-intuitive: T6 has the lowest maximum surface temperature. Equipment marked T6 therefore satisfies a stricter surface-temperature limit than equipment marked T4, assuming all other conditions are equivalent."] },
      { heading: "Check the ambient range", paragraphs: ["A temperature-class marking applies under the conditions covered by the certificate, including its ambient-temperature range. High ambient temperatures, dust layers, installation position or process heating may require additional assessment."] },
    ],
    faq: [
      { question: "Does T6 mean the equipment operates at 85°C?", answer: "No. It is the maximum surface-temperature class, not the normal operating temperature or ambient rating." },
      { question: "Can I select equipment using temperature class alone?", answer: "No. Zone or EPL, gas or dust group, protection concept, ambient range and environmental conditions must also match." },
    ],
    sources: [{ label: "IEC 60079-0 — general requirements and marking", url: "https://webstore.iec.ch/en/publication/71519" }],
  },
  {
    slug: "how-to-select-flameproof-cable-gland",
    title: "How to Select a Flameproof Cable Gland",
    shortTitle: "Choose the right cable gland",
    category: "Equipment selection",
    description: "Work through cable dimensions, armour, entry threads and certification to prepare a complete flameproof cable gland specification.",
    takeaways: ["Cable and entry checklist","Barrier-gland considerations","Installation details to confirm"],
    answer: "Select a flameproof cable gland by matching the certified protection concept, gas group, zone or EPL, cable construction and diameter, entry thread, material, ingress protection, ambient range and any barrier-gland requirements.",
    readMinutes: 7,
    updatedAt: "2026-09-12",
    sections: [
      { heading: "Start with the certificate—not the thread size", paragraphs: ["A gland can physically fit and still be unsuitable. Begin with the enclosure certificate and installation instructions: they identify the permitted entry devices, thread form, sealing arrangement and any special conditions of use."] },
      { heading: "Cable and entry checklist", paragraphs: ["Use the cable manufacturer’s actual dimensions rather than choosing only from core count or nominal conductor area. Two cables described as 3 core 70 sq mm can have different bedding and overall diameters."], bullets: ["Armoured or unarmoured construction", "Cable bedding diameter and overall diameter", "Armour type and dimensions", "Metric, NPT or other certified entry thread", "Required sealing, clamping and earth continuity", "Material compatibility and corrosion exposure"] },
      { heading: "Confirm the hazardous-area duty", paragraphs: ["Check the gland marking, certificate and instructions against the equipment protection concept, gas group, zone or EPL, temperature and ingress requirements. Determine whether a barrier or compound-filled gland is required by the cable construction, enclosure, standard or project specification."] },
      { heading: "Installation matters", paragraphs: ["Correct tightening, armour preparation, sealing and engagement are necessary for the certified arrangement to work. Use the manufacturer’s instructions and trained installers; do not mix components from different gland systems unless specifically approved."] },
    ],
    faq: [
      { question: "Can cable gland size be selected from cable core size alone?", answer: "No. The actual bedding and overall cable diameters, armour details and entry thread are needed." },
      { question: "Does every Ex d installation need a barrier gland?", answer: "Not automatically. The requirement depends on the applicable installation rules, cable construction, enclosure details, certificate and project specification." },
    ],
    relatedProductCategory: "cable-glands",
    sources: [{ label: "IEC 60079-14 — electrical installation design and selection", url: "https://webstore.iec.ch/en/publication/32878" }],
  },
  {
    slug: "flameproof-equipment-certification-india",
    title: "Flameproof Equipment Certification in India",
    shortTitle: "Ex equipment approvals in India",
    category: "Compliance",
    description: "Understand the different roles of product certification, BIS licensing and PESO approval, and the documents to check before procurement.",
    takeaways: ["Certification and approval roles","PESO jurisdiction and current guidance","Purchaser document checklist"],
    answer: "Certification requirements in India depend on the product and where it will be installed. For installations within PESO’s jurisdiction, Ex electrical apparatus may require approval from the Chief Controller of Explosives in addition to applicable testing, certification and BIS requirements.",
    readMinutes: 7,
    updatedAt: "2026-09-12",
    sections: [
      { heading: "There is no single certificate for every situation", paragraphs: ["The applicable route depends on the equipment type, protection concept, manufacturing location and the rules governing the installation. A test report, product certificate, BIS licence and PESO approval perform different functions and should not be treated as interchangeable."] },
      { heading: "PESO jurisdiction", paragraphs: ["PESO states that approval requirements apply to electrical equipment used in hazardous areas falling within its statutory jurisdiction. Its published procedure identifies relevant provisions under the Petroleum Rules, Gas Cylinders Rules and Static and Mobile Pressure Vessels rules.", "Because official procedures and validity requirements can change, project teams should verify the current PESO circulars and application guidance at the time of procurement."] },
      { heading: "What purchasers should verify", paragraphs: ["Ask for documents that identify the exact manufacturer, product type, variants and safety marking. Confirm that schedules, drawings and special conditions cover the item being supplied—not merely a similar product family."], bullets: ["Certificate and approval numbers", "Covered model or variant", "Ex marking, gas group and temperature class", "Applicable standard and edition", "Validity and any special conditions", "Consistency between nameplate, certificate and supplied configuration"] },
      { heading: "Use competent project review", paragraphs: ["This page is an orientation guide, not an approval decision. The end user, hazardous-area designer and relevant authority should confirm the requirements for the specific installation."] },
    ],
    faq: [
      { question: "Does every electrical product in India need PESO approval?", answer: "No. PESO describes approval in relation to hazardous installations under its jurisdiction. The product and installation context must be checked." },
      { question: "Is an IECEx certificate the same as PESO approval?", answer: "No. IECEx certification and an approval issued under Indian statutory requirements are distinct. Confirm which documents the particular installation requires." },
    ],
    sources: [
      { label: "PESO — current SOP for Ex electrical apparatus", url: "https://www.peso.gov.in/web/en/sop-approval-ex-electrical-apparatus-installed-hazardous-areas" },
      { label: "PESO — flameproof equipment FAQs", url: "https://www.peso.gov.in/web/index.php/en/node/297" },
    ],
  },
];

export function getKnowledgeArticle(slug: string) {
  return knowledgeArticles.find((article) => article.slug === slug);
}

export const knowledgeCategories = [
  "Hazardous areas",
  "Protection concepts",
  "Equipment selection",
  "Compliance",
] as const;
