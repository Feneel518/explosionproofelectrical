import type { EditorialBlogPost } from "./editorial-blog-posts";

export type BuyerGuidePost = EditorialBlogPost & {
  relatedCategorySlugs: string[];
};

type GuideInput = Pick<BuyerGuidePost,
  "slug" | "cat" | "image" | "imageAlt" | "title" | "excerpt" |
  "seoTitle" | "seoDescription" | "keywords" | "relatedCategorySlugs" | "content"
>;

function guide(input: GuideInput): BuyerGuidePost {
  return {
    ...input,
    publishedAt: "2026-11-19T00:00:00+05:30",
    updatedAt: "2026-11-19T00:00:00+05:30",
    authorName: "ExEC Editorial Team",
    featured: false,
  };
}

// These are source-controlled publication inputs. Public pages read the saved
// database records so subsequent edits, scheduling and unpublishing stay in the CMS.
export const buyerGuidePosts: BuyerGuidePost[] = [
  guide({
    slug: "flameproof-junction-box-selection-guide",
    cat: "Equipment selection",
    image: "/marketing/blog/flameproof-junction-box-selection-guide-editorial-v2.webp",
    imageAlt: "Illustrative cast-metal junction enclosure with brass cable glands and armoured cables in a process plant",
    title: "Flameproof Junction Box Selection: Terminals, Entries and Gas Groups",
    excerpt: "Build a junction-box specification around the actual circuit, cable schedule and hazardous-area dossier, with a worked enquiry example and a practical comparison table.",
    seoTitle: "Flameproof Junction Box Selection Guide",
    seoDescription: "Specify a flameproof junction box by gas group, terminals, cable entries, enclosure material and heat loading. Includes a practical RFQ checklist.",
    keywords: ["flameproof junction box selection", "flameproof terminal box", "IIC junction box", "flameproof junction box cable entries"],
    relatedCategorySlugs: ["flameproof-junction-boxes"],
    content: `A flameproof junction box should be selected from the hazardous-area requirements and the circuit it must terminate. Choosing a body diameter first, then trying to fit the terminals and cables inside, often creates avoidable quotation revisions. Start with the approved area dossier, terminal schedule and cable-entry drawing; use enclosure dimensions to accommodate that specification.

This guide addresses the purchasing decision. For the physical protection principle, see [how a flameproof enclosure works](/blog/what-is-a-flameproof-enclosure). To compare available products, visit the [ExEC flameproof junction-box range](/catalog/category/flameproof-junction-boxes).

## Write the hazardous-area requirement first

Record the zone, required Equipment Protection Level, gas subgroup, temperature class and ambient-temperature range exactly as supplied by the project engineer. Keep gas and dust requirements separate. A gas approval does not establish suitability for combustible dust.

Do not ask for "IIC or equivalent" without identifying what equivalence means. The relevant marking, certificate schedule and conditions must cover the actual application. If the project specifies hydrogen service, the gas-group review needs particular attention; see the [gas-group reference](/knowledge-hub/iia-iib-iic-gas-groups).

## Build a terminal schedule before choosing the box

List every circuit, conductor cross-section, terminal type, earth terminal and spare position. Distinguish terminal count from core count: a circuit may need feed-through, disconnect, fuse or shield arrangements, and those arrangements occupy different space.

Ask the supplier to return a terminal layout, permitted conductor ranges and the applicable electrical loading limits. More spare terminals can be useful, but they do not create permission to add future circuits beyond the certified configuration. A larger enclosure also needs enough working access for bending and terminating the actual cables.

| Selection item | Information to send | What to request back |
|---|---|---|
| Terminals | Circuit count, conductor sizes and terminal functions | Terminal schedule and arrangement |
| Electrical duty | Voltage, current and simultaneous loading | Permitted configuration and thermal limitations |
| Cable entries | Quantity, face, thread type and size | Dimensioned entry drawing |
| Installation | Mounting surface and access restrictions | Mounting dimensions and cover clearance |
| Environment | Ambient range, chemicals and outdoor exposure | Material, finish and documented environmental rating |

## Specify every cable entry

An entry description should identify both size and thread form. A nominal metric size is insufficient if pitch is missing; an NPT entry is not interchangeable with a similar-looking parallel thread. Include the intended entry face so the gland positions work with the cable tray and cover access.

Send actual cable outside diameters and armour details when glands are included. Identify unused entries and ask for suitable certified stopping plugs. If an adaptor is proposed, ask how it is covered by the equipment instructions and entry arrangement. Use the [cable-gland comparison guide](/blog/single-double-compression-barrier-cable-glands) to distinguish a cable seal from a barrier construction.

## Compare materials against the service environment

Compare the enclosure material and finish with the plant's corrosion specification, cleaning chemicals, mounting arrangement and maintenance practice. Avoid assuming that "outdoor" describes every exposure: sheltered utility areas and corrosive process washdown areas can need different material decisions.

Ask for the actual IP rating and the conditions needed to maintain it. IP protection and explosion protection address different requirements. A weatherproof enclosure with a high IP rating cannot be substituted for the required Ex equipment.

## Worked enquiry: two incoming cables and four outgoing cables

Consider an illustrative project with two incoming cables, four outgoing cables and a defined terminal schedule. The useful enquiry is not simply "six-entry junction box". It includes the cable diameters, entry threads, entry faces, circuit currents, conductor sizes, earth arrangement, required marking and installation clearances.

The supplier can then propose a body and terminal arrangement and identify any conflicts. If all six cables approach from below, the entry drawing must demonstrate physical gland clearance. If the box is mounted beside a pipe rack, the cover must remain accessible. These checks help compare quotations on the same basis.

## Questions before ordering

### Can I drill an additional entry later?

Do not plan an uncontrolled field alteration. Obtain the manufacturer's documented route for the exact certified assembly before any change. An empty enclosure and a complete populated junction box are also different purchasing scopes.

### Is the smallest box the lowest-cost choice?

Compare the complete installed scope: box, terminals, glands, plugs, mounting and documentation. A cramped arrangement can create extra cable-routing work or force a specification revision.

### What should the supplier confirm?

Request a drawing revision, full model identification, certificate scope, terminal configuration and included accessories. [Send the ExEC team your cable and terminal schedules](/contact-us) and reference the [junction-box catalog](/catalog/category/flameproof-junction-boxes) when requesting a project-specific proposal.

## Technical reference

[IEC 60079-14:2024](https://webstore.iec.ch/en/publication/66049) covers Ex electrical installation design, selection, installation and initial inspection. Apply the edition adopted by your project and jurisdiction alongside the equipment certificate and manufacturer instructions. This purchasing worksheet does not assign an area classification.`,
  }),
  guide({
    slug: "flameproof-led-wellglass-vs-floodlight",
    cat: "Lighting",
    image: "/marketing/blog/flameproof-led-wellglass-vs-floodlight-editorial-v2.webp",
    imageAlt: "Illustrative wellglass pendant and floodlight illuminating a process-plant walkway at dusk",
    title: "Flameproof LED Wellglass vs Floodlight: Which Fitting Fits the Job?",
    excerpt: "Compare mounting, light distribution, glare, ambient temperature and maintenance access before choosing flameproof lighting for a process area.",
    seoTitle: "Flameproof LED Wellglass vs Floodlight",
    seoDescription: "Compare flameproof LED wellglass and floodlights by lighting task, mounting, optics, ambient temperature and maintenance. Build a clearer lighting RFQ.",
    keywords: ["flameproof LED wellglass vs floodlight", "flameproof LED lighting selection", "hazardous area lighting design", "flameproof floodlight"],
    relatedCategorySlugs: ["flameproof-lighting-fittings"],
    content: `Choose a flameproof LED wellglass or floodlight by the lighting task and a verified layout, then check the exact fitting against the hazardous-area requirements. Wattage alone cannot tell you whether an operator can read an instrument, see a walkway or work without uncomfortable glare.

A wellglass fitting is commonly considered for local downward illumination. A floodlight is commonly considered when an adjustable aiming direction and wider-area coverage are useful. The actual optical distribution and photometric calculation decide whether either option works in your installation.

## Start with what people need to see

Mark the working planes on a layout: floors, platforms, valve positions, stair treads and instrument faces. Include mounting heights, obstructions and normal operator viewing directions. A high lumen figure at the luminaire does not establish useful illumination at a shaded gauge behind pipework.

Ask the lighting designer to define the maintained illumination, uniformity and glare criteria required by the project. These should reflect the actual tasks and applicable workplace requirements. Do not adopt one generic lux figure for every industrial area.

## Compare the fitting styles

| Question | Wellglass option | Floodlight option |
|---|---|---|
| Where is light needed? | Often considered above a local work or circulation area | Often considered for directed coverage from an offset position |
| How is it mounted? | Check available pendant, ceiling or bracket arrangement | Check bracket, tilt range and locking arrangement |
| What controls the result? | Lens distribution, spacing and mounting height | Beam distribution, aiming and mounting height |
| What can go wrong? | Shadows from equipment below the fitting | Glare or spill from poor aiming |
| What must be compared? | Actual luminaire photometric data | Actual luminaire photometric data |

These are starting points, not fixed performance promises. Compare the [ExEC wellglass fitting](/catalog/flpwp-well-glass-fitting) and [small floodlight fitting](/catalog/flpwp-small-flood-light-fitting) with the exact configuration offered.

## Ask for a calculation using the actual product

Request an IES or LDT file where available and identify the model, output, optics and mounting orientation used in the calculation. Check how the design treats dirt, lumen depreciation and maintenance. For outdoor installations, include structures that may block light and areas where spill is undesirable.

Eaton's [discussion of LED optics and light quality](https://www.eaton.com/gb/en-gb/products/lighting-controls/hazardous-area-lighting/led-optics--light-quality-and-lenses.html) explains why beam control and glare matter. The purchasing implication is to compare illumination on the task rather than a wattage label or a photograph of a bright fitting.

## Check the hazardous-area and thermal limits

Supply the zone, required EPL, gas or dust group, temperature requirement and site ambient range. Confirm these against the exact certificate and supplied assembly. The required temperature class must remain valid at the intended ambient temperature and operating conditions.

High daytime temperatures, nearby process heat and exposed locations deserve an explicit review. Ask whether output or operating limits change at the specified ambient. Eaton's [LED design reliability guidance](https://www.eaton.com/in/en-us/products/lighting-controls/hazardous-area-lighting/system-design-requirements-for-reliable-led-lighting-in-harsh-an.html) treats thermal management and environmental exposure as distinct design factors; a long nominal LED life is not a complete reliability specification.

## Make maintenance part of the layout

A fitting that produces a good initial calculation may still be inconvenient if servicing requires a major shutdown or access platform. Record whether the unit can be reached safely, how it is isolated and what replacement parts are available for the approved construction.

Do not assume that a replacement driver or LED board with matching electrical values can be fitted without review. Request the manufacturer's approved maintenance and replacement instructions. For an existing installation, also read the [LED retrofit cost discussion](/blog/led-retrofits-hazardous-area-lighting).

## Worked comparison for a process platform

Imagine a platform with a central walkway, several upright vessels and instruments on their outer faces. An overhead wellglass arrangement may illuminate the walkway while leaving the instrument faces shadowed. A carefully aimed floodlight from the side might help, but could also shine into an operator's eyes.

Compare alternative layouts using the same working planes and maintenance assumptions. The useful result is a documented combination of suitable fittings and positions. It is not a rule that one fitting family is always better.

## Questions buyers ask

### Can the same wattage replace an existing fitting?

Use photometry and the certified electrical configuration to evaluate the replacement. Equal wattage does not imply equal illumination or identical hazardous-area suitability.

### Does IP66 prove flameproof suitability?

No. Ingress protection and explosion protection need separate evidence. See the [IP66 lighting explanation](/blog/ip-66-flameproof-light-fittings).

Send a layout, mounting heights and area dossier with your enquiry. Browse the [flameproof lighting range](/catalog/category/flameproof-lighting-fittings) or [request a configuration review](/contact-us).`,
  }),
  guide({
    slug: "flameproof-control-panel-specification-checklist",
    cat: "Equipment selection",
    image: "/marketing/blog/flameproof-control-panel-specification-checklist-editorial-v2.webp",
    imageAlt: "Illustrative closed bolted control panel with indicator windows, rotary operators and cable glands",
    title: "Flameproof Control Panel Specification: An RFQ Checklist for Projects",
    excerpt: "Define the load schedule, control logic, heat dissipation, entries and documentation needed to compare hazardous-area control-panel quotations.",
    seoTitle: "Flameproof Control Panel Specification Checklist",
    seoDescription: "Prepare a flameproof control panel RFQ with load schedules, control logic, heat loading, cable entries, drawings and certification requirements.",
    keywords: ["flameproof control panel specification", "flameproof panel RFQ", "hazardous area control panel", "flameproof distribution board"],
    relatedCategorySlugs: ["flameproof-panels"],
    content: `A useful flameproof control-panel specification describes a complete functioning assembly: its loads, control behaviour, installation conditions and required documentation. "Flameproof panel, IIC, IP66" leaves too much unresolved for suppliers to return directly comparable offers.

Begin with a single-line diagram, load schedule, control schematic and hazardous-area dossier. Then ask the supplier to explain the proposed certified assembly and any exclusions. Explore the [ExEC flameproof panel range](/catalog/category/flameproof-panels) alongside the checklist below.

## Define the electrical duties

List the incoming supply, frequency, number of phases, feeder ratings and connected loads. Identify motor starting arrangements, control voltages, protection functions and required indication. Provide the project's prospective fault-current and protective-coordination requirements to the responsible panel designer.

State the expected operating combinations. Several devices energised together can produce a different heat load from one device running alone. A load list without simultaneity information can conceal an important design constraint.

## Describe what the panel must do

Provide a control narrative as well as a drawing. Define local and remote modes, permissives, interlocks, trips and reset behaviour. Clarify whether the panel is part of a machinery emergency-stop function or a process safety function; those functions require their own design assessment beyond the enclosure protection concept.

Identify interfaces with the PLC, DCS or other equipment, including signal types, cable destinations and responsibility for field devices. Keep terminal numbering aligned with the circuit documents so the supplied panel can be commissioned against a consistent drawing set.

## Review the complete assembly

An enclosure certificate does not automatically approve every set of components that fits inside it. The proposal should establish how the finished panel, entries, operators and internal arrangement are covered by the applicable certification route.

R. STAHL's [Ex d steel enclosure information](https://r-stahl.com/en/us/products/components-cable-glands-and-enclosures/ex-d-steel/) distinguishes partially certified empty enclosures from finished equipment. That distinction is useful when evaluating an offer described only as a "certified box". Ask for the finished equipment identification and scope.

## Include a heat-dissipation review

Ask the supplier to evaluate the actual internal components and simultaneous operating conditions against the assembly's permitted thermal limits and ambient range. Do not use free internal volume as a substitute for a thermal assessment.

If the design changes after quotation, repeat the relevant assessment. Adding a power supply, contactor or transformer can affect more than the bill of materials. The revised arrangement must remain within the approved construction and temperature limitations.

| RFQ document | Detail to resolve | Supplier deliverable |
|---|---|---|
| Single-line diagram | Incoming and outgoing electrical duties | Marked-up approved diagram |
| Load schedule | Running and starting conditions | Component and rating schedule |
| Control narrative | Permissives, trips and reset behaviour | Control schematic |
| Cable schedule | Entries, gland sizes and terminal destinations | Gland and terminal drawings |
| Area dossier | Zone, group, temperature and ambient limits | Exact marking and certificate scope |
| Site layout | Mounting and service access | General arrangement drawing |

## Resolve cable access and operating clearance

Show which faces may accept entries and where cables approach the panel. Include bend radius, gland clearance, cover opening space and access to external operators. A layout that is convenient on a drawing may clash with a pipe rack or handrail on site.

List glands, adaptors and stopping plugs in the scope. Agree whether they arrive fitted or separately supplied and who is responsible for installation verification. See the [gland sealing comparison](/blog/single-double-compression-barrier-cable-glands) for the information needed to resolve a gland proposal.

## Worked scope clarification

Suppose one quote includes the panel, all cable glands, internal wiring, engraved labels and the final drawing pack. A second includes the enclosure and components but excludes glands, site wiring and documentation revisions. Comparing their totals as the same scope would be misleading.

Build a comparison sheet with included, excluded and pending items. Keep commercial acceptance separate from technical acceptance until the required configuration and documents are agreed. This makes price discussions more productive and reduces change-order surprises.

## Questions before purchase

### Can unused space be reserved for future components?

Yes as a design requirement, but future additions need review against the complete assembly's approved configuration and thermal limits. Physical space is only one constraint.

### What is the minimum document request?

Request the model identification, general arrangement, electrical drawings, terminal schedule, bill of materials, relevant certificate documentation and installation instructions. Define project-specific inspection and test records in the enquiry.

[IEC 60079-14](https://webstore.iec.ch/en/publication/66049) establishes the scope of Ex installation selection and initial inspection; the project and equipment documents establish the actual application. [Send your panel enquiry to ExEC](/contact-us) with the drawings and outstanding questions attached.`,
  }),
  guide({
    slug: "flameproof-local-control-station-selection",
    cat: "Equipment selection",
    image: "/marketing/blog/flameproof-local-control-station-selection-editorial-v2.webp",
    imageAlt: "Illustrative local control station with green and red push buttons and a rotary selector beside an industrial pump",
    title: "Flameproof Local Control Stations: Specify Buttons, Contacts and Indication",
    excerpt: "Turn a start-stop or local-remote requirement into a clear control-station enquiry with a device schedule, contact matrix and entry arrangement.",
    seoTitle: "Flameproof Local Control Station Selection",
    seoDescription: "Specify a flameproof local control station with button functions, contact arrangements, indicator voltage, cable entries and hazardous-area requirements.",
    keywords: ["flameproof local control station", "flameproof start stop push button", "hazardous area control station", "flameproof push button specification"],
    relatedCategorySlugs: ["flameproof-switch-gears", "flameproof-clean-room-switch-gears"],
    content: `A flameproof local control station connects an operator's action to a defined electrical function. To specify it properly, describe both sides: what the operator sees and does, and what contacts or signals the control system needs. Counting push buttons alone is not enough.

A start-stop station, a local-remote selector and a station containing an emergency-stop device may look similar while serving very different functions. Begin with the control schematic and operating philosophy, then select a complete assembly appropriate to the area classification.

## Create a device schedule

Give every operator and indicator a tag, function and position. Record the legend text, required colour, actuation type and any key or padlock requirement. For selector switches, state the number of positions, maintained or spring-return action, and the required contact state in each position.

For indicators, provide the supply voltage and signal meaning. "Red lamp" does not describe whether it means running, tripped or another project-defined condition. Agree the convention with the plant's controls team instead of relying on a supplier's default.

| Device | Information needed | Example enquiry field |
|---|---|---|
| Start button | Actuation and contact arrangement | Momentary, contact requirement per schematic |
| Stop button | Contact arrangement and circuit purpose | Contact requirement and legend per drawing |
| Selector | Positions and contact sequence | Local / Off / Remote with contact matrix |
| Indicator | Voltage, colour and meaning | Running indication, specified control supply |
| Key operator | Key removal and switching behaviour | Removable positions identified |

The examples are documentation prompts, not a control-circuit design. Specify contact ratings and suitability for the actual load and control voltage.

## Separate enclosure protection from control safety

Explosion protection addresses ignition hazards associated with the equipment. It does not by itself establish emergency-stop performance, functional safety or a suitable machine control architecture.

If a device contributes to a safety function, give the supplier the requirements determined by the machinery or process safety assessment. A red mushroom operator does not establish the performance of the complete safety circuit. Its contacts, monitoring, reset logic and associated controls need the appropriate system design.

## Match the configuration to the certificate

Confirm the required zone, EPL, gas group, temperature class and ambient range. Check the finished assembly's marking, component arrangement and entry requirements. Different protection concepts may be used in different control-station designs, so do not infer the protection concept from the enclosure material alone.

R. STAHL's [configurable local control-station range](https://r-stahl.com/en/ae/products/control-boxes/ex-e-local-control-boxes/) illustrates how device, contact and enclosure choices form a specific configuration. For background on the distinction between concepts, read [Ex d versus Ex e](/blog/ex-d-vs-ex-e).

## Review installation and operation

Show the station's mounting height and approach direction. Check that legends can be read where the operator stands and that nearby pipes or guards do not obstruct an actuator. If gloves are used, consider the actual operating task when approving the arrangement.

List incoming cables, conductor sizes, entry threads and required gland positions. Confirm access for termination and maintenance. Where cleanroom installation is proposed, include cleaning-agent compatibility and mounting-interface requirements; see the [pharmaceutical cleanroom lighting checklist](/blog/flameproof-cleanroom-lighting-pharmaceutical-plants) for the distinction between Ex and cleanroom suitability.

## Worked example: local and remote operation

Consider a pump controlled from a DCS with a local station used during maintenance and commissioning. An enquiry saying "start, stop, selector and two lamps" leaves the selector sequence, indication meaning and mode behaviour unresolved.

A better pack includes a front layout, a contact matrix for each selector position, an indication schedule and the control drawing. It defines which functions are available in local and remote modes and records any questions for the controls engineer. The supplier can then quote the physical station against a documented requirement.

## Questions to resolve before ordering

### Can I change a contact block after delivery?

Obtain the manufacturer's approved replacement or modification instructions for the exact assembly. Matching the external dimensions is insufficient evidence of compatibility.

### Is a start-stop station suitable for any motor?

The station and circuit must suit the actual switching duty and control arrangement. Motor power does not directly define every control-contact requirement, particularly when contactors or PLC inputs are involved.

Review the [ExEC start-stop push-button product](/catalog/flpwp-start-stop-push-button) and [flameproof switchgear range](/catalog/category/flameproof-switch-gears). [Send the device schedule and schematic](/contact-us) to request an application-specific proposal.`,
  }),
  guide({
    slug: "flameproof-cleanroom-lighting-pharmaceutical-plants",
    cat: "Industry applications",
    image: "/marketing/blog/flameproof-cleanroom-lighting-pharmaceutical-plants-editorial-v2.webp",
    imageAlt: "Illustrative pharmaceutical cleanroom corridor with flush linear ceiling lights and stainless-steel process equipment",
    title: "Flameproof Cleanroom Lighting for Pharmaceutical Plants: A Buyer Checklist",
    excerpt: "Evaluate hazardous-area suitability, cleaning compatibility, ceiling interfaces and service access as separate requirements for pharmaceutical lighting.",
    seoTitle: "Flameproof Cleanroom Lighting for Pharma",
    seoDescription: "Specify flameproof cleanroom lighting for pharma with Ex requirements, cleaning-agent compatibility, ceiling details, photometry and maintenance access.",
    keywords: ["flameproof cleanroom lighting", "flameproof lighting pharmaceutical plants", "hazardous area clean room light fitting", "pharma cleanroom lighting specification"],
    relatedCategorySlugs: ["flameproof-clean-room-lighting-fittings"],
    content: `Flameproof cleanroom lighting must meet the requirements of both the hazardous-area installation and the controlled production environment. A luminaire's Ex documentation does not establish cleanroom suitability, and a smooth cleanable fitting does not establish explosion protection. The purchasing specification needs evidence for each requirement.

In pharmaceutical projects, begin by asking whether the particular room or defined location is classified as hazardous. The presence of pharmaceutical production alone does not assign a zone. The approved area dossier and cleanroom requirements should come from the project's responsible teams.

## Keep three evaluations visible

Evaluate explosion protection, cleanroom compatibility and lighting performance separately. This avoids accepting a fitting because it passes one evaluation while leaving another unanswered. R. STAHL's [cleanroom luminaire discussion](https://r-stahl.com/en/global/blog/post-detail/clean-room-luminaires-need-triple-qualification/) describes this combination of requirements in the same application.

| Evaluation | Project input | Evidence to request |
|---|---|---|
| Explosion protection | Area dossier, substance, ambient range | Exact marking, certificate scope and instructions |
| Cleanroom compatibility | Room requirements and cleaning procedure | Material, surface and cleaning compatibility information |
| Lighting performance | Tasks, working planes and room geometry | Photometric data and layout assessment |
| Ceiling integration | Ceiling type, thickness and pressure boundary | Installation drawing and interface details |
| Maintenance | Permitted access and cleaning constraints | Service procedure and approved replacement scope |

## Define the cleaning exposure precisely

Provide the cleaning agents, concentrations, application method and expected exposure. Ask about the lens, housing, finish, gaskets and seals, not only the main body material. A material statement such as "stainless steel" is too broad to settle the compatibility of every exposed component.

Describe whether routine cleaning involves wiping, spraying or another process. Do not interpret a single IP rating as approval for all cleaning chemicals, water pressures or temperatures. The equipment instructions and documented compatibility should address the proposed procedure.

## Resolve the ceiling interface early

For recessed fittings, send the ceiling construction, panel thickness, cut-out requirements and access arrangements. Identify who is responsible for sealing the luminaire-to-ceiling interface and maintaining the controlled environment's integrity.

Check whether service occurs from above, below or both. A service route that looks convenient during construction may become restricted once the room operates. Confirm required clearances before ceiling fabrication and coordinate the drawing revision with the building contractor.

## Check the exact hazardous-area scope

Record the required zone, EPL, gas or dust group, surface-temperature requirement and ambient range. Solvent vapours and combustible dust present different classification questions; neither can be resolved from a general product label.

Request the certificate and instructions for the configuration being offered, including the entry accessories. Avoid treating "GMP" as an explosion-protection marking or "Ex" as a hygiene qualification. R. STAHL's [cleanroom explosion-protection overview](https://r-stahl.com/en/global/blog/post-detail/clean-explosion-protection/) highlights that cleanability, chemical resistance and electrostatic characteristics need consideration alongside Ex protection.

## Specify the visual task

Describe whether personnel are reading labels, operating equipment, checking connections or inspecting product. Provide room dimensions and obstructions, and state the project's required illumination and glare criteria. A corridor and a detailed inspection location need different assessments.

Agree whether emergency operation is required and how it is supplied, tested and maintained. Do not assume every normal-service luminaire has an approved emergency variant. Include the exact variant and operating mode in the technical review.

## Worked enquiry for a solvent-processing suite

An illustrative enquiry might include the approved area classification, a reflected ceiling plan, the cleaning procedure, the ceiling manufacturer's interface drawing and a maintenance-access restriction. Those inputs let suppliers explain the proposed fitting's suitability and any unresolved interface.

If one offer assumes above-ceiling access and another assumes access from within the room, request clarification before comparing prices. The difference may affect installation details, maintenance planning and the cleanroom team's acceptance of the proposal.

## Questions buyers ask

### Does a pharmaceutical facility need flameproof lights everywhere?

Use the documented area classification for each location. Do not assign hazardous status to the whole building solely from the industry name.

### Can the cleaning team use its normal chemical procedure?

Confirm the proposed procedure against the materials and instructions for the exact fitting. Request a documented answer when the compatibility is unclear.

Browse the [ExEC flameproof cleanroom lighting range](/catalog/category/flameproof-clean-room-lighting-fittings). [Send your ceiling plan and cleaning requirements](/contact-us) with the area dossier to make the enquiry specific enough for a technical response.`,
  }),
  guide({
    slug: "flameproof-equipment-rfq-checklist-india",
    cat: "Procurement",
    image: "/marketing/blog/flameproof-equipment-rfq-checklist-india-editorial-v2.webp",
    imageAlt: "Illustrative engineering specification workspace with drawings, digital caliper, cable glands and a closed enclosure",
    title: "Flameproof Equipment RFQ Checklist for Indian Industrial Projects",
    excerpt: "Use a structured enquiry and document matrix to compare flameproof equipment suppliers on the same scope, from area requirements to dispatch records.",
    seoTitle: "Flameproof Equipment RFQ Checklist India",
    seoDescription: "Prepare an Indian flameproof equipment RFQ with area data, cable schedules, approval documents, drawings, inspection requirements and commercial scope.",
    keywords: ["flameproof equipment RFQ checklist", "flameproof equipment supplier India", "flameproof equipment procurement", "flameproof manufacturer evaluation"],
    relatedCategorySlugs: ["flameproof-junction-boxes", "flameproof-lighting-fittings", "flameproof-panels"],
    content: `A clear flameproof equipment RFQ helps suppliers quote the same technical and commercial scope. It also helps your project team identify missing information before a purchase order commits everyone to a price and delivery date. The most useful starting point is a document pack, not a list of product names.

Use this checklist when approaching a flameproof equipment supplier in India. It is a purchasing workflow; the responsible engineer must establish the area classification and technical requirements. For background on approval roles, read the [Indian certification reference](/knowledge-hub/flameproof-equipment-certification-india).

## Prepare a common enquiry pack

Send one controlled revision to every supplier. Include quantities and item tags, area requirements, electrical duties, cable schedules, installation details and the required documentation. Highlight any information still pending so suppliers identify assumptions rather than silently filling gaps.

| RFQ section | Include | Ask the supplier to identify |
|---|---|---|
| Application | Location, purpose and item tags | Proposed model and quantity |
| Hazardous area | Approved zone, EPL, group, temperature requirement | Exact marking and application limitations |
| Electrical duty | Voltage, current, frequency and operating conditions | Offered ratings and configuration |
| Mechanical | Mounting, space and entry drawing | Dimensions, material and accessories |
| Environment | Ambient range and exposure | Suitable finish and environmental limits |
| Documentation | Certificates, drawings and instructions | Supplied documents and pending approvals |
| Commercial | Delivery point, packing and inspection scope | Price, exclusions and lead-time basis |

## Verify documents against the offered item

Ask for model-specific documentation rather than a folder of company logos. Compare the offered model and configuration with the certificate, schedule, nameplate and installation instructions. Ask the supplier to explain any suffix, limitation or condition that affects your application.

IECEx provides an [online certificate system for verification](https://www.iecex.com/our-impact-and-initiatives/who-benefits/). Where IECEx certification is offered, check the record and relevant issue rather than relying only on a downloaded marketing PDF. The [IECEx operational guidance](https://www.iecex.com/dmsdocument/1598/) explains specific conditions of use and component limitations; request the applicable details for the actual certificate.

## Establish which Indian approvals apply

Avoid a blanket requirement that every possible approval applies to every industrial location. PESO's [official flameproof equipment FAQ](https://www.peso.gov.in/web/en/faqs-under-various-heads) relates its electrical-equipment approval requirement to areas within its jurisdiction under the Petroleum Rules. Identify the project's applicable regulatory route with the responsible team.

Do not reject or accept an approval solely from a printed expiry date. PESO's [10 September 2025 circular](https://www.peso.gov.in/web/sites/default/files/2025-09/CIRCULAR_10-09-2025.PDF) provides a conditional validity extension for certain approvals. Ask the supplier to demonstrate how any relevant circular applies to the exact approval, including exclusions and subsequent changes. Use the authority's current documents when placing an order.

## Compare scope before comparing totals

Create a side-by-side comparison for glands, stopping plugs, brackets, lamps or LED equipment, terminals, labels, drawings, inspection and packing. Mark each item included, excluded or unresolved. Two offers with different accessories and documentation are different purchasing scopes.

Ask when the delivery clock starts. "Six weeks" may mean from purchase order, advance payment, approved drawings or technical clearance. Record the trigger and any buyer actions that affect it. Avoid treating an unapproved drawing as a completed technical review.

## Resolve deviations in writing

Maintain a deviation register with the enquiry requirement, offered alternative, supplier explanation and project disposition. For example, a proposed entry-thread change should be checked against the actual cable accessories and layout. A suggested temperature-class or ambient change requires technical review, not a commercial note saying "equivalent".

Link every accepted change to the final drawing and item schedule. This keeps purchasing, inspection and commissioning teams aligned on what was actually ordered.

## Plan the dispatch and receipt checks

Define the required inspection records and document pack before order placement. On receipt, compare model identification, quantities, accessories, drawing revision and visible condition with the order. Escalate mismatches before installation and retain the documents for the installation dossier.

### What information helps a supplier quote accurately?

Send the item schedule, approved area requirements, electrical duties, cable details and required document list together. Ask the supplier to identify any remaining assumptions so they can be resolved before technical acceptance.

### Can a supplier select the zone from my factory name?

The enquiry needs an approved area classification. The factory's industry or location is insufficient to determine a zone or its extent.

Use the [junction-box guide](/blog/flameproof-junction-box-selection-guide), [panel RFQ checklist](/blog/flameproof-control-panel-specification-checklist) and [lighting comparison](/blog/flameproof-led-wellglass-vs-floodlight) for item-level questions. [Send your enquiry pack to ExEC in Vapi](/contact-us) to request a configuration-specific quotation.`,
  }),
  guide({
    slug: "flameproof-switch-socket-selection-guide",
    cat: "Equipment selection",
    image: "/marketing/blog/flameproof-switch-socket-selection-guide-editorial-v2.webp",
    imageAlt: "Illustrative enclosed industrial switch socket with rotary operator, blue plug and black cable in a process plant",
    title: "Flameproof Switch Socket Selection: Ratings, Interlocks and Compatibility",
    excerpt: "Specify the complete plug-and-socket arrangement for hazardous areas, including load duty, pin configuration, interlocking, cable entries and accessories.",
    seoTitle: "Flameproof Switch Socket Selection Guide",
    seoDescription: "Select a flameproof switch socket by electrical duty, plug compatibility, interlocking, cable entries, mounting and the exact hazardous-area approval.",
    keywords: ["flameproof switch socket selection", "flameproof plug and socket", "hazardous area socket outlet", "flameproof interlocked socket"],
    relatedCategorySlugs: ["flameproof-switch-gears"],
    content: `A flameproof switch socket enquiry should define the whole connection system: the socket, matching plug, switching arrangement, cable termination and installation conditions. Selecting only by current rating can leave compatibility and operating behaviour unresolved.

Start with the equipment being powered, its supply and duty, and the approved hazardous-area dossier. Review the offered assembly's certificate and instructions before treating any combination of plug and socket as interchangeable. Browse the [ExEC switch socket product](/catalog/flpwp-switch-socket-unit) alongside this guide.

## Describe the actual electrical load

Provide voltage, frequency, phases, required conductors and load current. Identify motor starting or other switching demands that the responsible designer must assess. Include any project requirements for protective devices and fault conditions.

If the equipment is mobile or routinely disconnected, describe that operating pattern. It affects the connection arrangement, cable support and maintenance plan. A temporary application still needs suitable hazardous-area equipment and a controlled installation.

## Identify the exact plug and socket pairing

Request the manufacturer's matching plug model and its documented compatibility with the offered socket. Confirm pole arrangement, earth connection, voltage identification and any mechanical coding. A similar colour or apparent physical fit is insufficient evidence of suitability.

Do not assume an ordinary industrial plug is acceptable because it looks robust or shares a current rating. R. STAHL's [plug-and-socket technical data](https://r-stahl.com/fileadmin/tx_aimeos/Files/i_/en/8570_PlugsAndSockets_EK00_III_en/Data-Sheet-Sockets-Series-8570-11-EN.pdf) illustrates that compatibility restrictions form part of a specific product design. Establish the corresponding restrictions for the exact product being purchased.

## Ask how the interlock works

Specify the required switching and connection sequence. Ask when the plug can be inserted or withdrawn, how the switch state controls that action, and what prevents unsafe operation. Confirm the behaviour in the manufacturer instructions and the accepted equipment design.

R. STAHL's [interlocked socket product information](https://r-stahl.com/en/in/products/plugs-and-sockets/plugs-and-sockets/series-857021-20-a-wall-mounting-sockets-60583/) provides an example of a load-disconnect switch with mechanical locking. This is a design example, not evidence that another socket provides the same behaviour. Obtain the details for the offered model.

| Selection question | Information to record |
|---|---|
| What is the supply? | Voltage, frequency, phases and conductor arrangement |
| What is the duty? | Running load and relevant switching conditions |
| What mates with it? | Exact plug and socket model pairing |
| How is it operated? | Switching, insertion, withdrawal and locking sequence |
| How is it cabled? | Cable construction, diameter, entry thread and gland |
| Where is it installed? | Mounting, access, ambient and environmental exposure |

## Include cable entries and mechanical support

Provide the cable data for both the fixed socket and any supplied plug. Identify sheath diameter, armour arrangement and conductor sizes. Confirm terminal capacity and the correct cable-entry accessory for each end.

Show how the cable is routed and supported so its weight is not left as an unreviewed mechanical load on the termination. Include bends, access and potential impact from nearby operations in the installation review. For gland questions, consult the [sealing-method comparison](/blog/single-double-compression-barrier-cable-glands).

## Check protection for the full operating arrangement

Verify the exact marking and certificate against the required zone, EPL, group, temperature and ambient range. Gas approval does not establish dust suitability. Check ingress-protection claims for the actual operating state, including what the manufacturer requires when the plug is removed.

List caps, covers, seals, fixing accessories and earthing provisions in the quote. Missing accessories can change the installation scope or leave the receiving team unsure what should be fitted.

## Worked enquiry for a portable maintenance load

An illustrative maintenance enquiry identifies the powered tool or equipment, supply, load duty, cable type, connection frequency and classified location. It requests the matched plug-and-socket arrangement, interlock behaviour and required termination accessories.

If an existing plant socket must be reused, provide its exact identification and documentation. Ask for a compatibility review before ordering a replacement plug. Matching a nominal current rating is only one part of that review.

## Common questions

### Can a socket also serve as the isolation point?

Have the responsible electrical designer assess the offered switching and locking arrangement against the project's isolation requirements. Do not infer an isolation function from the product name.

### Can different brands be mixed?

Use a combination only where the equipment documentation establishes compatibility and the complete installation remains suitable. Physical connection alone does not demonstrate that.

Review the [flameproof switchgear catalog](/catalog/category/flameproof-switch-gears), then [send ExEC the load and connection details](/contact-us) for a specific offer.`,
  }),
  guide({
    slug: "single-double-compression-barrier-cable-glands",
    cat: "Equipment selection",
    image: "/marketing/blog/single-double-compression-barrier-cable-glands-editorial-v2.webp",
    imageAlt: "Illustrative macro view of machined cable glands, seals and threaded components on a dark engineering workbench",
    title: "Single, Double Compression and Barrier Cable Glands: What to Specify",
    excerpt: "Separate trade descriptions from certified sealing construction, and send the cable and entry information needed to resolve a hazardous-area gland quotation.",
    seoTitle: "Double Compression vs Barrier Cable Glands",
    seoDescription: "Understand single and double compression versus barrier cable glands. Compare sealing construction, cable dimensions, thread details and certification.",
    keywords: ["double compression vs barrier cable gland", "flameproof double compression cable gland", "single vs double compression gland", "barrier gland selection"],
    relatedCategorySlugs: ["flameproof-accessories"],
    content: `Single compression, double compression and barrier gland describe different aspects of cable-gland construction. They are not interchangeable approval levels. For hazardous-area procurement, specify the certified gland model and its suitability for the actual cable, enclosure and installation requirements rather than relying on a trade description alone.

This comparison focuses on interpreting quotations. For the wider selection sequence, see [how to select a flameproof cable gland](/knowledge-hub/how-to-select-flameproof-cable-gland). Review the [ExEC cable-gland product](/catalog/flpwp-et-cable-gland) with the exact configuration offered.

## What do single and double compression mean?

In common trade usage, the terms refer to sealing or compression arrangements around the cable. The detailed construction can differ by product family and manufacturer. A double compression description often relates to arrangements engaging inner and outer cable layers, but the drawing and instructions must establish what the offered gland actually does.

Ask the supplier to identify the sealing surfaces, supported cable construction and dimensional ranges. Also ask how armour is retained or bonded where applicable. An armoured cable needs more information than a nominal overall diameter.

## What makes a barrier gland different?

A barrier construction seals around individual conductors using the specified sealing system. The approved preparation, assembly and curing requirements depend on the product. Do not treat a barrier gland as simply another name for a gland with two compression seals.

CMP's [flameproof sealing-method explanation](https://www.cmp-products.com/us/en-us/cable-glands/technical/explosive-atmospheres/flameproof-sealing-methods/) distinguishes elastomeric sealing methods from barrier sealing. The procurement lesson is to request the actual sealing design and instructions, not infer the construction from how many nuts or seals are visible.

| Description | What it may tell you | What it does not establish |
|---|---|---|
| Single compression | A trade description of a compression arrangement | Complete Ex suitability or compatibility with every cable |
| Double compression | A trade description involving additional cable sealing arrangements | Automatic equivalence to a barrier gland |
| Barrier gland | A conductor-sealing barrier construction | Suitability without cable, certificate and installation review |
| Ex marking | Evaluated protection concepts and associated scope | Compatibility with a cable outside the permitted dimensions |

## Do I always need a barrier gland?

There is no sound universal answer based only on the phrase "Zone 1" or "double compression". The responsible designer must apply the adopted installation standard, equipment instructions, cable characteristics and certificate conditions. Ask the supplier to document the proposed selection against that basis.

[IEC 60079-14:2024](https://webstore.iec.ch/en/publication/66049) addresses Ex electrical installation selection and installation. Avoid copying an old gland-selection flowchart without confirming its edition and applicability to the project. Where the requirements are unclear, resolve them before placing the order.

## Send the right cable dimensions

Provide the cable manufacturer's datasheet and identify its construction. For an armoured cable, include overall diameter, inner bedding diameter, armour type and the relevant armour dimensions. For an unarmoured cable, identify the sheath material, dimensions and any special construction that could affect the seal.

Check the permitted range at every interface. A gland can suit the overall diameter yet be unsuitable for the inner bedding or armour. Do not plan to make an undersized cable fit using tape or an improvised sleeve.

Eaton's [technical paper on cables and glands](https://www.eaton.com/content/dam/eaton/markets/oil-and-gas/knowledge-center/whitepaper/cables-and-cable-glands-for-hazardous-locations.pdf) discusses cable dimensional compatibility and sealing considerations. Use it as technical background, with the actual manufacturer's current instructions governing the offered gland.

## Resolve the entry connection separately

Record the enclosure entry's exact thread type, nominal size and pitch where applicable. Confirm available engagement, wall arrangement and any approved adaptor. Similar nominal dimensions do not make metric, NPT and other thread forms interchangeable.

List the complete accessory scope: seals, earth tags, locknuts, shrouds, adaptors or other items only as required by the approved arrangement. Have the supplier identify included parts and installation conditions rather than adding a generic accessory kit without review.

## Worked quotation clarification

Imagine two offers for an armoured cable described as "double compression flameproof gland". One matches the cable's overall diameter but leaves the bedding range unstated. The other identifies all dimensional ranges, the entry thread, the sealing construction and the certificate scope.

The first offer still needs technical clarification. Request the missing information before treating the products as equivalent. If a barrier is required, ask for its exact assembly procedure and installation consumables as part of the offer.

## Questions to settle before ordering

### Does every double compression gland have Ex approval?

No. Verify the actual product's marking, certificate and instructions. The trade description alone provides no such evidence.

### Can the supplier select a gland from the cable core count?

Core count alone does not establish the cable diameters, construction or entry connection. Send the datasheet and the enclosure requirements.

Browse the [flameproof accessories range](/catalog/category/flameproof-accessories) and [send ExEC the cable datasheet and entry schedule](/contact-us) for a documented gland proposal.`,
  }),
];

export function getBuyerGuideSlugsForCategory(categorySlug: string) {
  return buyerGuidePosts
    .filter((post) => post.relatedCategorySlugs.includes(categorySlug))
    .map((post) => post.slug);
}
