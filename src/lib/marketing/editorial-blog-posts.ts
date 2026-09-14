export type EditorialBlogPost = {
  slug: string;
  cat: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  imageAlt: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
};

const fundamentals = `Electrical equipment used around flammable gas, vapour or combustible dust cannot be selected from the word “flameproof” alone. A correct specification is a chain: identify the atmosphere, establish the zone, choose the required Equipment Protection Level, verify the gas or dust group, check temperature limits, select an appropriate protection concept, and then confirm environmental and installation conditions.

This guide explains that chain. If you only need the physical construction principle, read [What is a flameproof enclosure?](/blog/what-is-a-flameproof-enclosure). For the protection code and marking system, go directly to [What is Ex d protection?](/blog/what-is-ex-d-protection).

## Start with the hazardous-area classification

A hazardous area is a location in which an explosive atmosphere is present, or may be expected to be present, in a quantity that requires special precautions for equipment construction, installation and use.

Area classification is a process-engineering task. It considers the material released, grade of release, ventilation, geometry and operating conditions. It should be documented by a competent person; the equipment supplier should not guess a zone from the industry name or a photograph.

For gases and vapours, [IEC 60079-10-1](https://webstore.iec.ch/en/publication/63327) addresses area classification. For combustible dust, IEC 60079-10-2 is the relevant part of the series.

### Gas and vapour zones

| Zone | Presence of explosive gas atmosphere | Typical conceptual example* |
|---|---|---|
| Zone 0 | Continuously, for long periods or frequently | Vapour space inside certain process vessels |
| Zone 1 | Likely to occur occasionally in normal operation | Defined area around a routine release point |
| Zone 2 | Not likely in normal operation; if it occurs, it persists only briefly | Defined area around a secondary release |

### Combustible-dust zones

| Zone | Presence of explosive dust cloud | Typical conceptual example* |
|---|---|---|
| Zone 20 | Continuously, for long periods or frequently | Inside certain dust-handling equipment |
| Zone 21 | Likely to occur occasionally in normal operation | Defined area near a filling or transfer point |
| Zone 22 | Not likely in normal operation; if it occurs, it persists only briefly | Area where an abnormal dust release may occur briefly |

*Examples are illustrative only; they do not establish the zone or its physical extent.*

The official [IECEx hazardous-area certification overview](https://www.ul.com/services/hazardous-areas-iecex-certification-international-market-access) summarizes these zone definitions. Never describe Zone 0 simply as “more explosive” than Zone 1. Zones describe frequency and duration of the explosive atmosphere, not the energy of an explosion.

## Match the zone to the Equipment Protection Level

Equipment Protection Level (EPL) expresses the level of protection assigned to equipment. A commonly used mapping is:

| Atmosphere | Zone | Common minimum EPL |
|---|---:|---|
| Gas | 0 | Ga |
| Gas | 1 | Gb |
| Gas | 2 | Gc |
| Dust | 20 | Da |
| Dust | 21 | Db |
| Dust | 22 | Dc |

This table is a starting point, not permission to ignore local regulations, the certificate or the area-classification dossier. For example, equipment marked \`Ex db ... Gb\` is ordinarily selected for Zone 1 or Zone 2 gas locations—not Zone 0. Zone 0 requires equipment and a protection approach suitable for EPL Ga.

## Identify the gas group

For Group II gas equipment used in surface industries, the familiar subdivisions are IIA, IIB and IIC. They relate to ignition and flame-transmission characteristics, including concepts such as maximum experimental safe gap and minimum igniting current ratio.

| Gas subgroup | Common representative gas | Relative equipment-design demand |
|---|---|---|
| IIA | Propane | Baseline within Group II subdivisions |
| IIB | Ethylene | More demanding than IIA |
| IIC | Hydrogen and acetylene | Most demanding of these subdivisions |

From the gas-subgroup perspective, IIC equipment generally covers IIB and IIA, and IIB generally covers IIA. Suitability still depends on every other part of the marking and certificate. Do not write that IIC gas is automatically “more dangerous”; the subgroup describes characteristics relevant to equipment design and testing.

## Check the temperature class

An explosive atmosphere may be ignited by a hot surface even when there is no electrical spark. The temperature class states the equipment’s maximum surface-temperature class under its certified conditions.

| Temperature class | Maximum surface temperature |
|---|---:|
| T1 | 450°C |
| T2 | 300°C |
| T3 | 200°C |
| T4 | 135°C |
| T5 | 100°C |
| T6 | 85°C |

The selected class must be appropriate for the ignition characteristics of the gas or vapour and the applicable safety requirements. A lower maximum surface temperature is more restrictive: T6 is cooler than T4. However, \`T6\` alone does not make equipment suitable if its EPL, gas group, ambient range or protection concept is wrong.

Temperature classification must be read with the marked ambient range. Loading a junction box beyond the certified arrangement, changing internal components or operating outside the permitted ambient range can alter thermal performance.

## Understand the protection concept

\`Ex\` indicates equipment intended for explosive atmospheres under the applicable marking framework. The letters that follow identify the protection technique.

\`Ex d\` is flameproof enclosure protection: an enclosure is constructed and tested to withstand an internal explosion of a specified gas mixture and prevent transmission capable of igniting the surrounding atmosphere. [IS/IEC 60079 (Part 1):2014](https://standardsbis.bsbedge.com/) is the Indian adoption relevant to many currently certified products; [IEC 60079-1](https://webstore.iec.ch/) is the international standard for equipment protection by flameproof enclosures “d”. The edition shown on the actual certificate governs the certified product.

Other protection concepts work differently. For example, increased-safety \`Ex e\` applies additional measures to prevent excessive temperatures, arcs and sparks under the conditions covered by that protection concept. Protection techniques are not interchangeable merely because they can serve the same zone.

## Do not confuse Ex protection with IP protection

An IP code describes ingress protection against access, solid foreign objects and water. The code is defined by [IEC 60529](https://www.iec.ch/ip-ratings).

- IP65: dust-tight, with the specified protection against water jets.
- IP66: dust-tight, with the specified protection against powerful water jets.

IP66 does not mean Ex d, and Ex d does not by itself state IP66. Both claims must be supported independently by the equipment documentation.

## How to read a complete marking

Consider this illustrative marking:

\`Ex db IIC T6 Gb  |  Tamb -20°C to +55°C  |  Certificate No. ...X\`

| Marking element | Meaning |
|---|---|
| \`Ex\` | Explosion-protected equipment marking |
| \`db\` | Flameproof enclosure protection level \`db\` |
| \`IIC\` | Gas subgroup |
| \`T6\` | Maximum surface-temperature class of 85°C under certified conditions |
| \`Gb\` | Equipment Protection Level for gas atmosphere |
| \`Tamb\` | Certified ambient-temperature range |
| Certificate number | Traceable certificate and schedule |
| Suffix \`X\` | Specific conditions of use exist and must be read |

## Practical selection example 1: propane process area

Assume the approved area-classification dossier identifies a Zone 1 gas location, the material subgroup is IIA, and the required temperature class is T3 or cooler.

An item marked \`Ex db IIB T4 Gb\` may meet the zone, gas-group and temperature-class portions because Gb is associated with Zone 1, IIB covers IIA from the subgroup perspective, and T4 has a lower maximum surface temperature than T3. The engineer must still verify the certificate, ambient range, electrical rating, enclosure configuration, entries, glands, corrosion exposure and installation instructions.

For a terminal application, review the [ExEC flameproof junction-box example](/catalog/flpwp-junction-box-100-dia) and request the exact certificate and approved configuration before specifying it.

## Practical selection example 2: hydrogen service

If a Zone 1 dossier identifies hydrogen, the gas subgroup requirement is typically IIC. An IIB enclosure must not be substituted. Select equipment with the required EPL and temperature class, confirm the precise certificate scope, and verify that glands, stopping plugs and all entries are also appropriate for the installation.

## Practical selection example 3: Zone 0

Do not select a general \`Ex db ... Gb\` enclosure merely because its body is robust or its gas group is IIC. Zone 0 generally calls for EPL Ga and a protection concept permitted for that application. Escalate the selection to the responsible hazardous-area engineer.

## Pre-purchase engineering checklist

- Approved area-classification drawing and zone confirmed
- Gas, vapour or dust identified from process data
- Required EPL confirmed
- Gas or dust group confirmed
- Temperature class or maximum surface temperature confirmed
- Ambient-temperature range checked
- Electrical rating, component heat dissipation and configuration checked
- IP rating and corrosion environment checked separately
- Certificate number, schedule and any \`X\` conditions reviewed
- Cable type, gland type, thread, entry size and stopping plugs defined
- Earthing/bonding and mounting requirements defined
- Installation and inspection responsibilities assigned to competent persons

Explore the [complete ExEC product catalog](/catalog), including [flameproof control stations](/catalog/flpwp-start-stop-push-button), [lighting fittings](/catalog/flpwp-well-glass-fitting) and [cable-gland options](/catalog/flpwp-et-cable-gland). Product suitability must be confirmed against the application and certificate, not inferred from a category label.

## Common specification mistakes

- Writing only “flameproof, IP66” with no zone, EPL, group, temperature class or ambient range
- Treating Zone 2 as a non-hazardous area
- Assuming IIC automatically solves an incorrect temperature class or EPL
- Using the gas-zone system for a combustible-dust risk
- Treating an IP test as evidence of explosion protection
- Copying a marking from an old project without checking the present substance and area dossier
- Ignoring certificate suffix \`X\`, schedules, limitations or approved component combinations
- Allowing an installer to drill a new entry into a certified enclosure without manufacturer and certification control

## Standards and authoritative references

- IEC 60079-0 — Ex equipment: general construction, testing and marking requirements
- IEC/IS 60079-1 — equipment protection by flameproof enclosures “d”
- IEC 60079-10-1 — classification of areas: explosive gas atmospheres
- IEC 60079-10-2 — classification of areas: explosive dust atmospheres
- [IEC 60079-14](https://webstore.iec.ch/en/publication/66049) — design, selection, installation and initial inspection
- [IEC 60079-17](https://webstore.iec.ch/en/publication/64810) — inspection and maintenance
- IEC/IS 60529 — degrees of protection provided by enclosures (IP Code)
- [IECEx overview of explosion-protection techniques](https://www.iecex.com/assets/Uploads/D2S2-Ex-Protection-Techniques-BARTEC.pdf)

## Conclusion

Correct hazardous-area selection is a compatibility exercise. Zone, EPL, group, temperature class, protection concept, ambient range, IP rating, entries and certificate conditions must all agree. Use the marking as a structured checklist—and use the certificate and area dossier as the authority.`;

const enclosure = `A flameproof enclosure is a tested explosion-protection construction for equipment that may contain ignition-capable components. It is not intended to stop flammable gas from ever entering, and it is not simply a thick metal box. Its job is to withstand a specified internal explosion and prevent that event from transmitting through the enclosure joints in a way that ignites the surrounding atmosphere.

This article focuses on the physical enclosure: body, cover, flamepaths, fasteners, entries and inspection. For the broader selection sequence, read [Flameproof Fundamentals](/blog/flameproof-fundamentals-a-complete-guide-to-hazardous-area-equipment). For \`Ex d\`, \`db\` and EPL marking, read [What is Ex d protection?](/blog/what-is-ex-d-protection).

## The containment principle

Switches, contactors, relays and other electrical components may create arcs, sparks or hot surfaces. If an ignitable gas mixture is present inside an enclosure and ignition occurs, pressure rises rapidly.

A compliant flameproof enclosure is designed and tested so that:

- its construction withstands the internal explosion pressure under the applicable test conditions;
- flame or hot products do not transmit through its joints and ignite the specified surrounding test atmosphere;
- its temperature remains within the marked class under certified operating conditions; and
- the complete assembly—including covers, fasteners, entries and accessories—matches the evaluated design.

The construction and testing requirements for protection by flameproof enclosures “d” are addressed by IEC 60079-1 and its Indian adoption, IS/IEC 60079 (Part 1):2014, where that is the edition applicable to the certificate. The [BIS product manual for flameproof-enclosure equipment](https://www.bis.gov.in/) identifies IS/IEC 60079 (Part 1):2014 as the relevant Indian product standard; always inspect the specific product certificate rather than relying on a general statement.

## What is a flamepath?

A flamepath is the controlled joint through which combustion products could pass from the enclosure interior to the outside. Depending on the certified construction, examples may include:

- a flat flanged joint between body and cover;
- a cylindrical joint around a shaft or spindle;
- a threaded body-and-cover joint; or
- a certified threaded entry and matching accessory.

The permissible joint type, length, gap, surface condition and thread engagement depend on the certified design and gas group. These dimensions are safety-critical; they are not generic machining suggestions.

The flamepath does not work as a rubber seal. Its protection depends on the controlled metallic path and geometry evaluated in testing. A gasket may support the IP rating or environmental sealing when permitted by the design, but it must not be assumed to create the Ex d protection.

## Main construction elements

### Enclosure body and cover

The material, wall geometry and machining form part of the evaluated construction. Cast aluminium alloy, cast iron and stainless steel may be used when included in the product design and certificate. Material choice also affects corrosion behaviour, weight and maintenance.

### Fasteners

Cover bolts are part of the pressure-containing assembly. Their grade, material, number, location and engagement must match the approved design. Missing bolts, substitutions or uneven tightening can compromise both mechanical integrity and environmental sealing.

### Cable entries, glands and stopping plugs

Every entry must have the correct thread form and size and be fitted with an accessory suitable for the protection concept, cable and installation method. Unused entries require appropriate certified stopping plugs. A reducer, adaptor or gland should never be selected merely because its thread “seems to fit.”

Review [ExEC cable-gland options](/catalog/flpwp-et-cable-gland) when defining entries, and verify the exact certificate, thread and cable arrangement for the project.

### Internal components and heat

The number, rating, spacing and power dissipation of internal components can affect temperature classification and pressure behaviour. A large empty enclosure is not an unrestricted invitation to install any combination of components. Use the approved configuration or obtain manufacturer confirmation.

### Earthing and bonding

Internal and external earthing provisions must be used as required by the design and installation standard. Paint, corrosion or loose hardware must not create an unreliable connection.

## Practical example: selecting a terminal enclosure

Suppose a Zone 1 process area requires a terminal junction box for an IIB gas atmosphere, T4 temperature class, an ambient range up to +50°C and outdoor water-jet exposure.

The engineer should confirm:

1. The equipment is certified with an EPL suitable for Zone 1.
2. Its gas subgroup covers IIB.
3. Its marked temperature class and ambient range cover the application.
4. The terminal quantity, conductor size, current and heat dissipation fit the approved configuration.
5. IP66 is supported separately under IEC/IS 60529.
6. Entry threads, cable glands and unused-entry stopping plugs are defined.
7. Corrosion protection, mounting, earthing and access for inspection are suitable.
8. Certificate schedules and any special conditions of use have been reviewed.

The [ExEC 100 mm flameproof junction box](/catalog/flpwp-junction-box-100-dia) is a useful product-format example, but its exact certification marking and approved configuration must be checked for the project.

## Installation and inspection checklist

[IEC 60079-14](https://webstore.iec.ch/en/publication/66049) covers design, selection, installation and initial inspection, while [IEC 60079-17](https://webstore.iec.ch/en/publication/64810) addresses inspection and maintenance. A practical pre-energization check should include, without replacing the standards:

- Nameplate is present, legible and matches the area dossier
- Certificate and schedule are available; \`X\` conditions are resolved
- Enclosure has no cracks, impact damage or unacceptable corrosion
- Flamepaths are clean and free from damage, unauthorized paint and contamination
- Cover closes fully without forcing or cross-threading
- All specified fasteners are present, correct and properly secured
- Entry thread type and size match the gland, adaptor or stopping plug
- Glands suit the cable and protection arrangement and are correctly installed
- Unused entries are closed with appropriate certified stopping plugs
- Conductors are terminated without overcrowding or excessive bending stress
- Internal components match the approved arrangement and ratings
- Earthing/bonding connections are present and secure
- Gaskets and seals are the correct approved parts and are not improvised
- IP protection is restored after closing
- Labels, warning notices and required opening delay are followed

Inspection grades and intervals should be set by competent persons using the applicable standard, environment, equipment history and risk.

## Common field mistakes

- Drilling or tapping a new cable entry in the field
- Grinding, filing, polishing or lapping a flamepath without an approved repair procedure
- Applying ordinary paint, PTFE tape, sealant or grease to a flamepath without manufacturer approval
- Leaving out one or more cover bolts because the lid “still feels tight”
- Substituting bolts of a different grade, length or head form
- Installing a gland with the wrong thread or inadequate engagement
- Using a non-certified blanking plug in an unused entry
- Pinching a conductor or foreign object in the cover joint
- Replacing a gasket with a visually similar item
- Mixing components from different enclosure variants
- Overfilling the enclosure and changing thermal performance
- Assuming IP66 proves the enclosure is flameproof

## Can a damaged enclosure be repaired?

Do not improvise. Isolate the equipment and refer it to the manufacturer or a competent repair facility. [IEC 60079-19](https://webstore.iec.ch/en/publication/84453) addresses overhaul, repair and reclamation of Ex equipment. Repair decisions should consider the certificate, original drawings, material and permitted tolerances.

## Related ExEC equipment

- [Flameproof junction box — 100 mm example](/catalog/flpwp-junction-box-100-dia)
- [Flameproof start/stop control station](/catalog/flpwp-start-stop-push-button)
- [Flameproof well-glass lighting fitting](/catalog/flpwp-well-glass-fitting)
- [Complete ExEC product catalog](/catalog)

## Standards and authoritative references

- IEC/IS 60079-1 — equipment protection by flameproof enclosures “d”
- IEC 60079-0 — general Ex equipment construction, testing and marking
- [IEC 60079-14](https://webstore.iec.ch/en/publication/66049) — selection, installation and initial inspection
- [IEC 60079-17](https://webstore.iec.ch/en/publication/64810) — inspection and maintenance
- [IEC 60079-19](https://webstore.iec.ch/en/publication/84453) — repair, overhaul and reclamation
- IEC/IS 60529 — IP Code

## Conclusion

A flameproof enclosure is a complete, tested construction. Its safety depends on the body, cover, flamepaths, fasteners, entries, components and marked limits remaining consistent with the certified design. Treat every joint and accessory as an engineered safety feature—not ordinary enclosure hardware.`;

const exDProtection = `\`Ex d\` is the code for protection by a flameproof enclosure. The technique accepts that an explosive gas atmosphere may enter the enclosure and may ignite inside it. The certified enclosure contains the resulting pressure and prevents flame transmission capable of igniting the surrounding atmosphere.

The key point is containment, not exclusion. If you want to understand the body, cover and joint construction, read [What is a flameproof enclosure?](/blog/what-is-a-flameproof-enclosure). If you are building a complete project specification, start with [Flameproof Fundamentals](/blog/flameproof-fundamentals-a-complete-guide-to-hazardous-area-equipment).

## What the letters mean

- \`Ex\` identifies equipment using one or more standardized explosion-protection concepts.
- \`d\` identifies protection by a flameproof enclosure.

IEC 60079-1 contains the specific construction and test requirements for flameproof enclosure protection. In India, equipment may be certified against IS/IEC 60079 (Part 1):2014; use the exact standard and edition stated on the product certificate.

Modern markings may show \`da\`, \`db\` or \`dc\`. These suffixes express protection levels within the type of protection and relate to Equipment Protection Level. They should not be removed when quoting the marking.

## Ex da, Ex db and Ex dc

At a practical selection level:

| Marking | Associated gas EPL | Common zone relationship | Important note |
|---|---|---|---|
| \`Ex da\` | Ga | Zone 0 | Restricted/specific application scope; verify the standard and certificate |
| \`Ex db\` | Gb | Zone 1, and may be used in Zone 2 | Common marking for flameproof enclosures |
| \`Ex dc\` | Gc | Zone 2 | Lower protection level than db; certificate scope controls |

Do not convert a \`db\` marking into Zone 0 suitability. A product page, quotation or nameplate should state only the zones/EPL supported by its certificate and applicable rules.

The [IECEx overview of explosion-protection techniques](https://www.iecex.com/assets/Uploads/D2S2-Ex-Protection-Techniques-BARTEC.pdf) illustrates the containment basis of Ex d and the common EPL-to-zone relationship.

## What happens during an internal ignition?

1. A flammable gas mixture is present inside the enclosure.
2. An internal component provides an effective ignition source.
3. Combustion causes a rapid pressure rise.
4. The enclosure withstands the specified test event.
5. Combustion products passing through controlled joints are quenched sufficiently to prevent ignition of the specified external atmosphere.

The exact flamepath type and dimensions are part of the certified design. “Thicker metal” alone does not establish Ex d compliance.

## Breaking down \`Ex db IIC T6 Gb\`

| Element | Engineering meaning | Selection question |
|---|---|---|
| \`Ex\` | Explosion-protected equipment | Is the complete marking and certificate available? |
| \`db\` | Flameproof enclosure protection level | Is Gb suitable for the classified zone? |
| \`IIC\` | Gas subgroup | Does it cover the gas identified in the area dossier? |
| \`T6\` | Maximum surface-temperature class: 85°C | Is this class suitable for the gas and ambient conditions? |
| \`Gb\` | Equipment Protection Level for gas | Does it meet the project’s required EPL? |

A complete nameplate normally contains more information: manufacturer and type, serial or batch identification, electrical ratings, ambient range, IP code, certificate number and any special suffix.

### What does an \`X\` after the certificate number mean?

An \`X\` indicates specific conditions of use. Those conditions are mandatory, not optional fine print. They may concern ambient temperature, impact risk, electrostatic charging, fasteners, entries or another limitation. Obtain and read the certificate schedule before installation.

## Practical selection example: a Zone 1 push-button station

Assume a classified drawing identifies Zone 1, gas subgroup IIC and required temperature class T4, with ambient temperatures from 0°C to +50°C.

A push-button station marked \`Ex db IIC T6 Gb\` could satisfy the zone/EPL, gas-group and temperature-class portions. The engineer must still confirm:

- the marked ambient range includes +50°C;
- the push-button operators and internal components are part of the approved assembly;
- electrical ratings suit the control circuit;
- cable entries and glands match the certificate and cable type;
- IP and corrosion requirements suit the environment;
- any \`X\` conditions are met; and
- installation follows the manufacturer instructions and IEC/IS 60079-14.

Review the [ExEC flameproof start/stop push-button format](/catalog/flpwp-start-stop-push-button) as a product example, then request the exact certificate and configuration for the application.

## Ex d versus Ex e

The two concepts control ignition differently:

| Ex d | Ex e |
|---|---|
| Contains an internal ignition within a flameproof enclosure | Uses increased-safety measures to avoid arcs, sparks and excessive temperatures under the covered conditions |
| May house ignition-capable components when included in the certified design | Basic Ex e construction is not a general enclosure for ordinary sparking components |
| Depends heavily on enclosure strength and flamepath integrity | Depends on measures including terminal design, clearances, creepage and temperature control |

Assemblies may combine protection concepts. Read the full marking and certificate rather than choosing one from a generic comparison.

## What Ex d does not mean

- It does not mean an explosion can never occur inside the enclosure.
- It does not mean the enclosure is suitable for every gas group.
- It does not mean Zone 0 suitability unless the complete certified marking supports EPL Ga.
- It does not establish an IP65 or IP66 rating.
- It does not permit arbitrary drilling, component changes or field machining.
- It does not remain valid when flamepaths, fasteners, entries or approved construction are compromised.

## Pre-energization Ex d checklist

- Complete marking agrees with zone, EPL, gas group, temperature class and ambient range
- Certificate and schedule match the exact model; all \`X\` conditions are closed out
- Flamepaths and threads are clean, undamaged and unmodified
- Correct cover, fasteners and approved seals are installed
- Correct glands, adaptors and stopping plugs are fitted to matching entry threads
- Internal component arrangement and electrical loading are approved
- Earthing/bonding is complete
- Enclosure is fully closed before energization
- Initial inspection is recorded by a competent person

[IEC 60079-14](https://webstore.iec.ch/en/publication/66049) addresses design, selection, installation and initial inspection. Ongoing inspection and maintenance are addressed by [IEC 60079-17](https://webstore.iec.ch/en/publication/64810).

## Common mistakes when specifying Ex d

- Writing \`Ex d IIC T6\` but omitting EPL, ambient range and certificate requirements
- Treating all \`Ex d\` equipment as suitable for all three gas zones
- Selecting IIB equipment for hydrogen service without justification
- Assuming a T6 label covers operation outside the marked ambient range
- Mixing a certified enclosure with uncertified operators, glands or stopping plugs
- Using a product family certificate as proof for an unlisted configuration
- Quoting an obsolete or different standard edition without checking the certificate

## Related ExEC products

- [Start/stop push-button station](/catalog/flpwp-start-stop-push-button)
- [Switch-socket unit](/catalog/flpwp-switch-socket-unit)
- [Well-glass lighting fitting](/catalog/flpwp-well-glass-fitting)
- [Flameproof junction box](/catalog/flpwp-junction-box-100-dia)
- [Complete catalog](/catalog)

## Standards and authoritative references

- IEC/IS 60079-1 — equipment protection by flameproof enclosures “d”
- IEC 60079-0 — general equipment construction, testing and marking requirements
- [IEC 60079-14](https://webstore.iec.ch/en/publication/66049) — installation design, selection and initial inspection
- [IEC 60079-17](https://webstore.iec.ch/en/publication/64810) — inspection and maintenance
- [IECEx overview of explosion-protection techniques](https://www.iecex.com/assets/Uploads/D2S2-Ex-Protection-Techniques-BARTEC.pdf)

## Conclusion

Ex d is a defined protection technique, not a marketing synonym for heavy duty. Correct selection requires the complete marking—protection level, EPL, gas group, temperature class, ambient range and certificate conditions—and correct installation requires the certified construction to remain intact.`;

export const editorialBlogPosts: EditorialBlogPost[] = [
  {
    slug: "flameproof-fundamentals-a-complete-guide-to-hazardous-area-equipment",
    cat: "Engineering",
    publishedAt: "2026-09-14T06:30:00.000Z",
    updatedAt: "2026-09-14T06:30:00.000Z",
    image: "/placeholder.jpg",
    imageAlt: "Engineer comparing an Ex equipment marking with a hazardous-area classification drawing",
    title: "Flameproof Fundamentals: How to Select Hazardous-Area Equipment",
    excerpt: "A practical framework for reading zones, EPL, gas groups, temperature classes, Ex protection markings and IP ratings before selecting hazardous-area electrical equipment.",
    content: fundamentals,
    authorName: "ExEC Engineering Team",
    featured: true,
    seoTitle: "Flameproof Fundamentals: Hazardous-Area Equipment Guide",
    seoDescription: "Select hazardous-area equipment by zone, EPL, gas group, temperature class, Ex protection, ambient range and IP rating—with practical examples.",
    keywords: ["flameproof fundamentals", "hazardous area equipment selection"],
  },
  {
    slug: "what-is-a-flameproof-enclosure",
    cat: "Engineering",
    publishedAt: "2026-09-14T06:20:00.000Z",
    updatedAt: "2026-09-14T06:20:00.000Z",
    image: "/placeholder.jpg",
    imageAlt: "Open flameproof junction box showing its cover joint, cable entries, fasteners and terminals",
    title: "What Is a Flameproof Enclosure? Construction, Flamepaths and Inspection",
    excerpt: "See how a flameproof enclosure contains an internal ignition, how its flamepaths and entries work, and what engineers should inspect before installation.",
    content: enclosure,
    authorName: "ExEC Engineering Team",
    featured: false,
    seoTitle: "What Is a Flameproof Enclosure? Construction & Inspection",
    seoDescription: "Learn how a flameproof enclosure contains an internal explosion, how flamepaths work, what to inspect and which field modifications can defeat protection.",
    keywords: ["flameproof enclosure", "flamepath", "flameproof enclosure inspection"],
  },
  {
    slug: "what-is-ex-d-protection",
    cat: "Engineering",
    publishedAt: "2026-09-14T06:10:00.000Z",
    updatedAt: "2026-09-14T06:10:00.000Z",
    image: "/placeholder.jpg",
    imageAlt: "Hazardous-area equipment nameplate beside a bolted cast enclosure marked Ex db IIC T6 Gb",
    title: "What Is Ex d Protection? Meaning, Markings and Selection",
    excerpt: "Decode Ex d and Ex db markings, understand the containment principle, and see how EPL, gas group, temperature class and certificate conditions control selection.",
    content: exDProtection,
    authorName: "ExEC Engineering Team",
    featured: false,
    seoTitle: "What Is Ex d Protection? Meaning, Marking & Selection",
    seoDescription: "Understand Ex d and Ex db flameproof protection, how the marking relates to EPL, gas group and temperature class, and what must be checked before use.",
    keywords: ["Ex d protection", "Ex db meaning", "Ex d marking"],
  },
];
