export type CategoryLanding = {
  slug: string;
  name: string;
  description: string;
  paragraphs: string[];
  checklist: string[];
  guides: string[];
  related: string[];
  match: { category?: string; product?: string };
  faq: { question: string; answer: string }[];
};

export const categoryLandings: CategoryLanding[] = [
  {
    slug: "flameproof-junction-boxes", name: "Flameproof Junction Boxes",
    description: "Flameproof junction boxes manufactured by ExEC in Vapi, India. Compare terminal arrangements, enclosure sizes and cable entries for your project.",
    paragraphs: ["Junction boxes bring field cables and terminals together at a controlled connection point. The enclosure, terminal arrangement, cable entries and earthing must be selected as one assembly. ExEC's range includes circular and rectangular forms with configuration details available on each product page.", "Start with the area-classification dossier and the actual cable schedule. A terminal count alone is insufficient: conductor sizes, current, dissipated heat, entry positions and access for maintenance affect the required configuration. Verify the full certificate for the supplied enclosure and terminal arrangement before approving the installation."],
    checklist: ["Terminal quantity, conductor size and current", "Entry thread, cable diameter and gland arrangement", "Mounting, enclosure size and access clearance", "Gas group, EPL, temperature class and ambient range"],
    guides: ["what-is-ex-d-flameproof-protection", "iia-iib-iic-gas-groups"], related: ["flameproof-cable-glands", "flameproof-panels"], match: { category: "flameproof.*junction" },
    faq: [{ question: "Can every flameproof junction box be used in Zone 0?", answer: "No. Ordinary Ex db / Gb equipment is generally selected for Zone 1 or Zone 2. Zone 0 suitability requires the appropriate certified protection level and conditions; an IIC gas-group label alone does not establish it." }],
  },
  {
    slug: "flameproof-lighting-fittings", name: "Flameproof Lighting Fittings",
    description: "Explore ExEC flameproof lighting fittings manufactured in India, including wellglass, floodlights, bulkheads and tube lights. Request project specifications.",
    paragraphs: ["Hazardous-area lighting must satisfy both the lighting design and the equipment selection requirements. ExEC's catalog brings together wellglass fittings, floodlights, bulkheads, tube-light fittings and vessel lamps so engineers can compare the form and configuration suitable for each location.", "Prepare the required illuminance, mounting height, beam coverage and operating schedule alongside the hazardous-area classification. Lamp wattage is only one input. The complete Ex marking, surface-temperature class, ambient range and environmental protection must cover the supplied light source and enclosure assembly. A gas-area approval does not automatically establish dust-area suitability."],
    checklist: ["Illuminance target, mounting height and beam coverage", "Supply voltage and selected light-source configuration", "Ex marking, ambient range and temperature class", "Ingress exposure, corrosion and maintenance access"],
    guides: ["temperature-classes-t1-to-t6", "zone-0-zone-1-zone-2-hazardous-areas"], related: ["flameproof-floodlights", "flameproof-wellglass-lights"], match: { category: "^flameproof lighting" },
    faq: [{ question: "Does IP66 establish explosion protection?", answer: "No. IP66 describes ingress protection. Explosion protection is established by the complete Ex marking and supporting product certificate; both must be checked for the application." }],
  },
  {
    slug: "flameproof-panels", name: "Flameproof Control Panels",
    description: "ExEC flameproof control panels and panel enclosures manufactured in Vapi, India. Review sizes and configurations for hazardous-area electrical control.",
    paragraphs: ["A flameproof control panel combines an enclosure with a defined electrical assembly. Distribution, switching and instrumentation duties can require different internal layouts, operators and cable-entry arrangements. ExEC lists panel boxes and assembled panel options with the available configuration information.", "Share the single-line diagram, load schedule and control philosophy before selecting an enclosure. Component heat, service access and entry layout must remain within the certified construction. The certificate for an empty enclosure should not be assumed to approve every panel assembled inside it. Review the scope of the completed assembly with the responsible engineer."],
    checklist: ["Single-line diagram, load schedule and control logic", "Component layout and heat-dissipation assessment", "Incoming and outgoing cable-entry schedule", "Certificate scope for the completed panel assembly"],
    guides: ["what-is-ex-d-flameproof-protection", "temperature-classes-t1-to-t6"], related: ["flameproof-switch-gears", "flameproof-junction-boxes"], match: { category: "^flameproof panels" },
    faq: [{ question: "What is needed for a custom panel quotation?", answer: "Provide the electrical drawings, component requirements, area classification, required Ex marking, ambient conditions, cable schedule and mounting constraints. Our team can then review the configuration and documentation required." }],
  },
  {
    slug: "flameproof-switch-gears", name: "Flameproof Switchgear",
    description: "Compare ExEC flameproof push buttons, rotary switches, starters and switch-socket units manufactured in India. Review ratings and available configurations.",
    paragraphs: ["Local switching and motor control introduce electrical contacts and operators into the hazardous-area installation. ExEC's switchgear range includes push-button stations, rotary switches, starters, limit switches and switch-socket units. Product pages identify available ratings and arrangements rather than treating the whole range as one specification.", "Define the operating duty and circuit requirements first. Contact configuration, motor rating, interlocking and the physical operator arrangement determine the selection. For socket units, verify the complete mating arrangement and permitted operating procedure. Operators, shafts, fasteners and entries are part of the certified protection system and require the manufacturer's specified components."],
    checklist: ["Voltage, current, load duty and motor rating", "Contact arrangement and control sequence", "Interlocks and operator configuration", "Permitted cable entries and complete equipment marking"],
    guides: ["what-is-ex-d-flameproof-protection", "zone-0-zone-1-zone-2-hazardous-areas"], related: ["flameproof-panels", "flameproof-clean-room-switch-gears"], match: { category: "^flameproof switch" },
    faq: [{ question: "Can a switchgear rating be selected from enclosure size?", answer: "No. Use the electrical duty, component ratings and the certified assembly limits. Two units with similar enclosure dimensions can have different permitted loads and operating arrangements." }],
  },
  {
    slug: "flameproof-cable-glands", name: "Flameproof Cable Glands",
    description: "Flameproof cable-gland options from ExEC in India. Compare entry threads and configurations, then confirm cable dimensions and certificate compatibility.",
    paragraphs: ["Cable glands connect the cable to the enclosure while providing the sealing, retention and earth continuity required by their design. A thread that physically fits is only the starting point. ExEC's cable-gland product pages list available configurations for review against the actual cable and enclosure requirements.", "Use the cable manufacturer's bedding and overall diameters, armour details and construction data. Then check the enclosure certificate, permitted thread and gland protection concept. Barrier-gland requirements depend on the installation rules, cable construction and certificate conditions. Do not choose solely from conductor area or reuse a gland on a different cable without checking its certified range."],
    checklist: ["Bedding diameter, outer diameter and armour details", "Entry thread form, size and engagement", "Barrier sealing requirements and certificate conditions", "Material, corrosion exposure and ingress rating"],
    guides: ["how-to-select-flameproof-cable-gland", "iia-iib-iic-gas-groups"], related: ["flameproof-junction-boxes", "flameproof-panels"], match: { category: "^flameproof accessories", product: "cable gland" },
    faq: [{ question: "Is every Ex d cable gland a barrier gland?", answer: "No. Check the actual gland design and certificate. Determine the barrier-sealing requirement from the cable, enclosure, applicable installation rules and project specification." }],
  },
  {
    slug: "flameproof-clean-room-lighting-fittings", name: "Flameproof Clean-Room Lighting",
    description: "ExEC clean-room flameproof lighting manufactured in India. Review configurations for classified production rooms and request mounting and sealing details.",
    paragraphs: ["Clean-room lighting has to fit the room envelope and its maintenance procedure as well as the hazardous-area specification. ExEC's clean-room lighting range offers a starting point for production rooms where classified solvent hazards and room cleanliness requirements need coordinated design.", "Specify the ceiling or wall interface, cutout dimensions, room-side access, light-source arrangement and cleaning process. Clean-room construction alone does not establish explosion protection, and an Ex marking does not establish a particular clean-room class. Ask for documentation addressing both sets of requirements and check compatibility with the actual cleaning agents and site conditions."],
    checklist: ["Room envelope, cutout and mounting details", "Required illuminance and maintenance access", "Cleaning agents and exposed-material compatibility", "Hazardous-area marking and separate room requirements"],
    guides: ["temperature-classes-t1-to-t6", "flameproof-certification-india"], related: ["flameproof-clean-room-switch-gears", "flameproof-lighting-fittings"], match: { category: "flameproof clean.room lighting" },
    faq: [{ question: "Does a clean-room light automatically suit solvent hazards?", answer: "No. The classified location requires equipment with the appropriate complete Ex marking and certificate. Clean-room suitability and hazardous-area suitability must each be verified." }],
  },
  {
    slug: "flameproof-clean-room-switch-gears", name: "Flameproof Clean-Room Switchgear",
    description: "Explore ExEC clean-room flameproof switches, push buttons and socket arrangements manufactured in India. Request installation and configuration details.",
    paragraphs: ["Clean-room control points need a defined interface with the room wall and a practical operating arrangement. ExEC's clean-room switchgear includes local control and switching products for projects that require both a controlled room environment and hazardous-area equipment selection.", "Confirm faceplate dimensions, cutouts, wall depth, sealing method and access to the enclosure. Contact ratings, socket arrangements and control functions must meet the actual circuit duty. Room-side appearance should not obscure the need for certificate-controlled operators and enclosure joints. Provide the cleaning regime and installation drawing so material and mounting details can be reviewed."],
    checklist: ["Faceplate, cutout, wall depth and mounting method", "Control functions and electrical contact ratings", "Sealing and cleaning-process compatibility", "Complete Ex marking and certified operator arrangement"],
    guides: ["what-is-ex-d-flameproof-protection", "flameproof-certification-india"], related: ["flameproof-clean-room-lighting-fittings", "flameproof-switch-gears"], match: { category: "flameproof clean.room switch" },
    faq: [{ question: "Can ordinary switches be fitted behind a clean-room faceplate?", answer: "A faceplate does not establish hazardous-area suitability. Use the complete certified equipment arrangement and verify the electrical and room-interface requirements together." }],
  },
  {
    slug: "flameproof-fire-alarm", name: "Flameproof Fire Alarm Equipment",
    description: "ExEC flameproof hooters, manual call points and alarm equipment for classified locations. Compare available products and request system-integration details.",
    paragraphs: ["Alarm equipment in a classified area must be suitable for the atmosphere and compatible with the site's alarm system. ExEC's range includes audible alarms, manual call points and related devices, with product-specific configurations available in the catalog.", "Specify the supply voltage, signalling interface, contact arrangement, sound or visibility requirement and environmental exposure. Explosion protection and fire-alarm system performance are separate checks: a flameproof enclosure does not establish compatibility with a control panel or compliance with every system standard. Review the device documentation and the complete system design before procurement."],
    checklist: ["Supply voltage and control-panel interface", "Contact, monitoring and signalling requirements", "Audibility, location and environmental exposure", "Device certificate and separate system acceptance"],
    guides: ["zone-0-zone-1-zone-2-hazardous-areas", "flameproof-certification-india"], related: ["flameproof-junction-boxes", "flameproof-cable-glands"], match: { category: "^flameproof fire alarm" },
    faq: [{ question: "Does flameproof certification approve the complete alarm system?", answer: "No. Equipment explosion protection and alarm-system compatibility address different requirements. Verify the device certificate, system interface and applicable project acceptance criteria." }],
  },
  {
    slug: "flameproof-fans", name: "Flameproof Fans",
    description: "Explore ExEC flameproof fan configurations manufactured in Vapi, India. Review available sizes and ratings for a project-specific ventilation specification.",
    paragraphs: ["Fan selection combines an airflow duty with electrical and mechanical installation requirements. ExEC lists fan configurations for engineers comparing available sizes, mounting arrangements and motor ratings. The equipment must be checked against the actual classified location and the atmosphere it handles.", "Provide the required airflow and static pressure, mounting orientation, supply, ambient conditions and process exposure. The motor's marking should not be assumed to cover every mechanical ignition risk in a complete fan assembly. Review impeller construction, clearances, guarding and the assembly documentation. Ventilation design and area classification remain part of the site engineering assessment."],
    checklist: ["Airflow, static pressure and operating schedule", "Mounting, guarding and mechanical construction", "Motor rating, supply and ambient range", "Certificate scope for the supplied assembly"],
    guides: ["zone-0-zone-1-zone-2-hazardous-areas", "temperature-classes-t1-to-t6"], related: ["flameproof-switch-gears", "flameproof-panels"], match: { category: "^flameproof fans" },
    faq: [{ question: "Does a flameproof motor make any fan assembly suitable?", answer: "No. Verify the scope of the complete assembly and assess mechanical ignition risks and installation conditions alongside the motor certification." }],
  },
  {
    slug: "flameproof-instrumentation", name: "Flameproof Instrumentation",
    description: "Review ExEC hazardous-area measuring instruments, sensor and controller configurations. Request electrical interfaces and complete protection details.",
    paragraphs: ["Field instrumentation connects the process measurement to the control system. ExEC's catalog includes measuring instruments and selected sensor or controller products, allowing engineers to review the available configurations and ask for the electrical and mechanical interface details.", "Define the measurement range, accuracy requirement, process connection, signal output and supply before selecting a product. An intrinsically safe circuit and a flameproof enclosure use different protection principles; do not substitute one for the other from a category description. Check the complete marking, any associated apparatus and the installation conditions for the actual instrument arrangement."],
    checklist: ["Measurement range and process connection", "Signal interface, supply and associated equipment", "Ambient and process-temperature limits", "Complete protection concept and certificate conditions"],
    guides: ["what-is-ex-d-flameproof-protection", "temperature-classes-t1-to-t6"], related: ["flameproof-junction-boxes", "flameproof-panels"], match: { category: "^flameproof (measuring|accessories|switch)", product: "instrument|sensor|rtd|controller|indicator|measuring" },
    faq: [{ question: "Is flameproof instrumentation the same as intrinsic safety?", answer: "No. Flameproof containment and intrinsic safety are distinct protection concepts. Select the instrument and any associated circuit equipment according to the complete certificate and system design." }],
  },
  {
    slug: "flameproof-floodlights", name: "Flameproof Floodlights",
    description: "Compare ExEC flameproof floodlight configurations manufactured in India. Review available ratings and request mounting, beam and certification details.",
    paragraphs: ["Floodlights provide broader area coverage for process units, access routes and outdoor working spaces. ExEC's lighting range includes several floodlight forms and configurations. Compare the available models against the lighting layout rather than selecting solely by nominal wattage.", "Mounting height, beam distribution, aiming and obstructions determine useful illumination on the task plane. Wind exposure, bracket design and access for service also affect the installation. Confirm the selected light source and driver are covered by the complete assembly documentation, and check the marked ambient and surface-temperature limits for the site's conditions."],
    checklist: ["Lighting layout, beam distribution and aiming", "Bracket, mounting height and wind exposure", "Supply and light-source configuration", "Ex marking, temperature class and ambient range"],
    guides: ["temperature-classes-t1-to-t6", "zone-0-zone-1-zone-2-hazardous-areas"], related: ["flameproof-lighting-fittings", "flameproof-wellglass-lights"], match: { category: "^flameproof lighting", product: "flood" },
    faq: [{ question: "Can wattage alone determine floodlight coverage?", answer: "No. Use photometric data, mounting height, beam distribution and the required illuminance. Confirm the electrical and hazardous-area requirements separately." }],
  },
  {
    slug: "flameproof-wellglass-lights", name: "Flameproof Wellglass Lights",
    description: "ExEC flameproof wellglass lighting manufactured in Vapi, India. Compare available light-source configurations and request installation specifications.",
    paragraphs: ["Wellglass fittings use a suspended or mounted enclosure and glass chamber to provide local lighting in industrial spaces. ExEC's wellglass product range lists light-source configurations with type numbers and specifications available for comparison.", "Review mounting height, light distribution, guard construction and maintenance clearance. Glass, joints and fasteners belong to the certified assembly and should be replaced only with the specified parts. An LED conversion is a change to the assembly, not simply a lamp-efficiency decision: verify that the selected light source, driver and thermal arrangement are covered by the manufacturer's documentation."],
    checklist: ["Mounting method, height and maintenance clearance", "Selected light-source rating and supply", "Glass, guard and approved replacement components", "Certificate scope and thermal operating limits"],
    guides: ["what-is-ex-d-flameproof-protection", "temperature-classes-t1-to-t6"], related: ["flameproof-lighting-fittings", "flameproof-floodlights"], match: { category: "^flameproof lighting", product: "well.?glass|well glass" },
    faq: [{ question: "Can any LED lamp replace the original wellglass light source?", answer: "No. Verify the permitted light source, driver, thermal limits and complete assembly documentation. Use a manufacturer-supported configuration rather than an unassessed retrofit." }],
  },
];

export function getCategoryLanding(slug: string) {
  return categoryLandings.find(category => category.slug === slug);
}

export function matchesLanding(product: { name: string; cat: string }, landing: CategoryLanding) {
  return (!landing.match.category || new RegExp(landing.match.category, "i").test(product.cat)) &&
    (!landing.match.product || new RegExp(landing.match.product, "i").test(product.name));
}

export function productLandings(product: { name: string; cat: string }) {
  return categoryLandings.filter(landing => matchesLanding(product, landing));
}
