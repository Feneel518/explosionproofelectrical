export const marketingAsset = (name: string) => `/marketing/${name}`;

export const categoryFilters = [
  { label: "All", value: "all" },
  { label: "Lighting", value: "lighting" },
  { label: "Control Panels", value: "control-panels" },
  { label: "Instrumentation", value: "instrumentation" },
  { label: "Enclosures", value: "enclosures" },
  { label: "Accessories", value: "accessories" },
] as const;

export type CategoryFilter = (typeof categoryFilters)[number]["value"];

export const categories = [
  {
    code: "CAT-01",
    name: "Flameproof Lighting",
    description: "Wellglass, bulkheads and hand lamps that contain the spark in Zone 1 areas.",
    spec: "IP-66 / Ex d IIB",
    image: marketingAsset("wellglass.png"),
    imageClassName: "h-[210px] w-[78%]",
  },
  {
    code: "CAT-02",
    name: "Control Panels",
    description: "Built-to-spec flameproof control, instrumentation and switchgear panels.",
    spec: "IP-66 / Ex d IIB",
    image: marketingAsset("panel.png"),
    imageClassName: "h-[210px] w-[78%]",
  },
  {
    code: "CAT-03",
    name: "LED Floodlights",
    description: "High-output hazardous-area floodlighting for yards and process units.",
    spec: "IP-66 / Ex d IIC",
    image: marketingAsset("flood.png"),
    imageClassName: "h-[210px] w-[78%]",
  },
  {
    code: "CAT-04",
    name: "Tube Light Fittings",
    description: "Twin-tube flameproof batten fittings for walkways and platforms.",
    spec: "IP-66 / Ex d IIB",
    image: marketingAsset("Tubeloight.png"),
    imageClassName: "h-[210px] w-[78%]",
  },
  {
    code: "CAT-05",
    name: "Junction Boxes",
    description: "Cast enclosures, terminal boxes and cable glands for hazardous wiring.",
    spec: "IP-66 / Ex d IIC",
    image: marketingAsset("flame.png"),
    imageClassName: "h-[260px] w-[90%]",
  },
  {
    code: "CAT-06",
    name: "Instrumentation",
    description: "Push-button stations, plug-tops, limit and proximity switches, controllers.",
    spec: "IP-66 / Ex d IIC",
    image: marketingAsset("sketchfl.png"),
    imageClassName: "h-[210px] w-[78%]",
  },
];

export const pillars = [
  { num: "01", title: "Expertise", body: "Three decades engineering flameproof equipment for India's most demanding plants." },
  { num: "02", title: "Quality", body: "Pressure-tested castings and premium materials built to outlast the environment." },
  { num: "03", title: "Safety", body: "Every product meets the highest industry standards, CIMFR tested and PESO approved." },
  { num: "04", title: "Fast Delivery", body: "Responsive lead times and a pan-India network that keeps your plant running." },
];

export const products = [
  { slug: "led-wellglass-l-45", name: "LED Wellglass L-45", cat: "Lighting", image: marketingAsset("wellglass.png"), ip: "IP-66", group: "Ex d IIB", type: "EXEC L-45", filter: "lighting" },
  { slug: "led-floodlight-fl-150", name: "LED Floodlight FL-150", cat: "Floodlights", image: marketingAsset("flood.png"), ip: "IP-66", group: "Ex d IIC", type: "EXEC FL-150", filter: "lighting" },
  { slug: "twin-tube-fitting", name: "Twin Tube Fitting", cat: "Tube Lights", image: marketingAsset("Tubeloight.png"), ip: "IP-66", group: "Ex d IIB", type: "EXEC T-2x20", filter: "lighting" },
  { slug: "flameproof-control-panel", name: "Flameproof Control Panel", cat: "Control Panels", image: marketingAsset("panel.png"), ip: "IP-66", group: "Ex d IIB", type: "EXEC CP", filter: "control-panels" },
  { slug: "dol-starter-unit", name: "DOL Starter Unit", cat: "Control Panels", image: marketingAsset("panel.png"), ip: "IP-66", group: "Ex d IIB", type: "EXEC DOL", filter: "control-panels" },
  { slug: "hand-lamp-hl-20", name: "Hand Lamp HL-20", cat: "Lighting", image: marketingAsset("wellglass.png"), ip: "IP-54", group: "Ex d IIB", type: "EXEC HL", filter: "lighting" },
  { slug: "push-button-station", name: "Push-Button Station", cat: "Instrumentation", image: marketingAsset("sketchfl.png"), ip: "IP-66", group: "Ex d IIC", type: "EXEC PB-4", filter: "instrumentation" },
  { slug: "plug-socket-32a", name: "Plug & Socket 32A", cat: "Instrumentation", image: marketingAsset("sketchfl.png"), ip: "IP-66", group: "Ex d IIB", type: "EXEC PS-32", filter: "instrumentation" },
  { slug: "junction-box-jb", name: "Junction Box JB", cat: "Enclosures", image: marketingAsset("flame.png"), ip: "IP-66", group: "Ex d IIC", type: "EXEC JB", filter: "enclosures" },
  { slug: "terminal-enclosure", name: "Terminal Enclosure", cat: "Enclosures", image: marketingAsset("flame.png"), ip: "IP-66", group: "Ex d IIB", type: "EXEC TE", filter: "enclosures" },
  { slug: "cable-gland-set", name: "Cable Gland Set", cat: "Accessories", image: marketingAsset("flame.png"), ip: "IP-68", group: "Ex d", type: "EXEC CG", filter: "accessories" },
  { slug: "exhaust-fan-ef-12", name: "Exhaust Fan EF-12", cat: "Instrumentation", image: marketingAsset("sketchfl.png"), ip: "IP-55", group: "Ex d IIB", type: "EXEC EF-12", filter: "instrumentation" },
] satisfies Array<{
  slug: string;
  name: string;
  cat: string;
  image: string;
  ip: string;
  group: string;
  type: string;
  filter: CategoryFilter;
}>;

export const posts = [
  {
    slug: "hazardous-area-classification",
    cat: "Standards",
    date: "12 Jun 2026",
    read: "6 Min",
    image: marketingAsset("factory.jpg"),
    title: "Understanding Zone 0, 1 & 2 Hazardous Area Classification",
    excerpt: "How hazardous areas are zoned by the likelihood of an explosive atmosphere and what it means for equipment selection.",
    body: [
      "In a hazardous area, the question is never whether a spark could ignite the atmosphere. It is how often that atmosphere is present.",
      "Zone 0 describes a location where an explosive gas atmosphere is present continuously or for long periods. Zone 1 covers areas where it is likely in normal operation. Zone 2 is reserved for places where it is unlikely, and if it does occur, only for a short time.",
      "The zone dictates the equipment. A fitting certified for Zone 1 carries a protection concept rated to contain or avoid ignition under far more demanding conditions than one intended only for Zone 2.",
      "Getting the classification right is the foundation of every safe installation. The discipline is matching the equipment to the real risk.",
    ],
  },
  {
    slug: "ex-d-vs-ex-e",
    cat: "Engineering",
    date: "03 Jun 2026",
    read: "5 Min",
    image: marketingAsset("panel.png"),
    title: "Ex d vs Ex e: Choosing the Right Protection Concept",
    excerpt: "Two common protection concepts solve the same problem in very different ways. Here is how to choose.",
    body: [
      "Ex d, or flameproof, accepts that an explosion may happen inside the enclosure and builds a housing strong enough to contain it.",
      "Ex e, increased safety, takes the opposite approach: it prevents sparks and excessive temperatures from arising in the first place.",
      "Neither is universally better. Flameproof suits motors, switching and anything that arcs; increased safety suits terminal boxes and junction enclosures.",
    ],
  },
  {
    slug: "ip-66-flameproof-light-fittings",
    cat: "Products",
    date: "24 May 2026",
    read: "4 Min",
    image: marketingAsset("wellglass.png"),
    title: "Why IP-66 Matters for Flameproof Light Fittings",
    excerpt: "Certification tells you a fitting can contain an explosion. The IP rating tells you whether it will survive long enough to matter.",
    body: [
      "IP-66 means complete protection against dust ingress and protection against powerful water jets from any direction.",
      "For flameproof lighting, ingress protection and explosion protection work together. A cracked gasket can compromise the flame path that makes the fitting safe.",
      "When you specify a light fitting, read past the Ex marking to the IP rating. For outdoor and process areas, IP-66 should be the floor.",
    ],
  },
  {
    slug: "cimfr-peso-certification",
    cat: "Compliance",
    date: "15 May 2026",
    read: "5 Min",
    image: marketingAsset("factory.jpg"),
    title: "CIMFR & PESO: What Indian Certification Really Means",
    excerpt: "Two names appear on almost every legitimate flameproof product. Knowing each role removes procurement confusion.",
    body: [
      "CIMFR is a testing authority. It subjects a design to explosion, ingress and thermal tests defined by relevant standards.",
      "PESO is the statutory approval body. It reviews certification and grants the approval that makes a product legal to install in licensed hazardous premises.",
      "A product that is CIMFR tested and PESO approved has cleared both the technical and regulatory bar.",
    ],
  },
  {
    slug: "led-retrofits-hazardous-area-lighting",
    cat: "Lighting",
    date: "02 May 2026",
    read: "4 Min",
    image: marketingAsset("flood.png"),
    title: "LED Retrofits for Hazardous-Area Lighting: A Cost Case",
    excerpt: "LED has changed the economics of every flameproof fitting. The payback is usually measured in months.",
    body: [
      "The headline saving is energy. An LED wellglass typically draws a fraction of the wattage of the lamp it replaces.",
      "The less obvious saving is maintenance. Relamping a fitting in a Zone 1 area means a permit, isolation and labour.",
      "Across a plant with hundreds of fittings, the payback on an LED retrofit is usually measured in months, not years.",
    ],
  },
  {
    slug: "maintaining-flameproof-enclosures",
    cat: "Maintenance",
    date: "21 Apr 2026",
    read: "5 Min",
    image: marketingAsset("panel.png"),
    title: "Maintaining Flameproof Enclosures: A Field Checklist",
    excerpt: "A flameproof enclosure only stays flameproof if it is maintained as one.",
    body: [
      "Start with the flame path. The machined faces where the cover meets the body must be clean, undamaged and correctly torqued.",
      "Check the glands and stoppers next. Every entry must be sealed with a certified gland of the right type.",
      "Finally, confirm the gasket and the glass. A perished seal or cracked cover lets in the moisture and dust that IP ratings exist to keep out.",
    ],
  },
];

export type MarketingProduct = (typeof products)[number];
export type MarketingPost = (typeof posts)[number];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
