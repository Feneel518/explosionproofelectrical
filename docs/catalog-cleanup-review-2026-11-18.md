# Product and variant consistency review

Reviewed on 18 November 2026. Recommendation: retain the existing category → product → variant flow; standardize identity and specifications, retire confirmed duplicates with replacement links, and protect historical documents before editing live catalog information.

This was an investigation. No application behavior, database data, or database schema was changed. Local audit scripts and outputs are under the ignored `tmp/` directory. Definitions of the current domain terms are in [GLOSSARY.md](../GLOSSARY.md).

## Evidence and scope

Inspected the Prisma models and foreign keys; product/variant creation, editing, approval, duplication, removal and restoration; shared selection/search; public catalog; quotation/order/invoice snapshots and conversions; customer quotation and work-order rendering; customer price history; serial tracking; BOM and inventory relationships.

Read-only transactions queried the configured Neon database, `public` schema. The principal snapshot was taken at 18:45 IST; draft-reference and foreign-key checks followed at 18:47 IST. These are snapshots of the database configured for this checkout, not a verification that a particular deployed application uses the same database.

| Measure | Observed |
| --- | ---: |
| Categories | 18 |
| All products, including archived | 160 |
| Active, unarchived products | 138 |
| Archived products | 21 |
| Inactive, unarchived products | 1 |
| All variants | 397 |
| Variants under unarchived products | 374 |
| Active variants under active, unarchived products | 358 |
| Inactive variants under unarchived products | 15 |
| Variants under the one inactive, unarchived product | 1 |
| Unarchived variants with `Copy` in their names | 3 |
| Unarchived variants without any populated technical fields checked or nonblank sales components | 97 |
| Groups sharing all checked technical fields and sales components within a product | 24 groups / 67 variants |
| Quotation item rows | 953 |
| Sales-order item rows | 1,015 |
| Invoice item rows | 2,249 |
| Product serial numbers | 238, all linked to invoice items |
| Product approval requests | 69; none pending |
| Finished-good stock balance rows / stock ledger rows | 0 / 0 |
| Variant manufacturing BOMs | 0 |

The row counts include draft and historical records; they are not counts of documents or confirmed sales. The zero inventory counts are specifically for finished-good variants; raw-material and casting inventory are outside that statement. The 238 serials belong to `FLP/WP Square Bulk Head Fitting`.

Names/SKUs were compared after Unicode normalization, trimming, case folding, and collapsing whitespace. No repeated normalized product names, variant names within a parent, or SKUs were found among unarchived records. This does not exclude differently named duplicates, punctuation differences, or duplicates across different products.

Technical comparison included type number, rating, terminals, gasket, mounting, cable entry, earthing, cutout/plate size, size, glass, wire guard, RPM, kW, horsepower, and sorted sales component text/unit pairs. It excluded names, SKUs and media; groups with entirely blank technical/component data were excluded. Identical saved fields indicate a review group, not proof of equivalence. Different horsepower, material, closure, LED technology, color or dimensions may exist only in the name.

The existing product/variant parent links were consistent across the quotation, sales-order and invoice item pairs checked. Archived products still have 14 quotation lines, 16 order lines and 47 invoice lines attached. Preservation is already valuable.

## What is causing the clutter

1. **Exact identifiers do not define physical identity.** The schema makes product slug and variant SKU unique, plus exact variant name within a product. A renamed copy gets a new SKU without proving that its configuration is different. Create requests do not compare technical identity with existing or pending requests; approval relies on exact constraints and owner judgement.
2. **The Duplicate action copies specifications and adds `Copy`.** A user can change the name while retaining the original rating, dimensions or components. SKU generation is based on product and variant names and runs as the variant name changes in create mode.
3. **Product boundaries are inconsistent.** Some names contain dimensions or technology; elsewhere the same kinds of distinctions are variants. Enclosure-only and complete assemblies are also mixed in different ways. Some of these are legitimate construction differences, which must be verified before consolidation.
4. **Important distinguishing characteristics live only in free text.** Several names describe material, thread, entry count, horsepower or dimensions that the structured fields do not capture consistently.
5. **The generic variant form is misleading.** Examples include an IP rating placeholder for `rating`, gas-group text for `terminals`, material text for `gasket`, finish text for `mounting`, and an HSN example for several unrelated fields. These prompts can contribute to poor data entry.
6. **Deactivation does not remove records from the shared selector.** `searchProductVariantsForSelectAction` excludes deleted parents but does not filter product or variant status. Its candidate population currently includes 374 variants, although only 358 are active under active parents. Public catalog filtering behaves differently and already filters active status.
7. **Historical copies still depend partly on live catalog data.** Quotation rendering reads product technical attributes, variant images and components; the work-order view reads current product/variant names and drawings. Stored snapshots are helpful but do not fully isolate these outputs.
8. **Price history is tied to the exact variant ID.** Retiring a duplicate without a verified equivalence mapping fragments price history and product analytics. Moving an old variant to another parent can also create inconsistent parent links in existing items.

## Concrete records to review first

| Product / configuration | Observed problem | Recommended decision |
| --- | --- | --- |
| Tubelight Fitting / `25W` | Rating remains `20W, 230v`; type number is shared with 20W | Verify the actual configuration and correct fields; do not merge based on the copied values |
| Spare Switch / `32A, 415V` | Rating says `16A, 230V` | Verify and correct before offering it as a reliable reusable configuration |
| Spare Driver / `150W - Multi - 5050` and `80W - Multi - 5050` | Both have rating `100W,230V` | Verify ratings and driver specifications; retain distinct power variants if real |
| ET Cable Gland / `16mm Electrical Thread (BS Conduit)` | Size says `19 mm or 3/4" ET` | Resolve the name/size contradiction from the actual item/drawing |
| ET Cable Gland / `19mm ... SS` and other SS variants | Parent material is `Brass`; the model has no variant material override | Keep material-specific product families for the first cleanup, or explicitly add variant material support before grouping them |
| ET Cable Gland / `1/2"NPT` | NPT entry is under an ET-named family; a separate NPT family exists | Verify the thread and map it to the correct family without rewriting old item links |
| ET Cable Gland / `45mm ... Copy` | Visible copy suffix and `45mnm` size typo; one quotation line | Verify and rename/correct if legitimate; a suffix alone does not establish a duplicate |
| Exhaust Fan / `9" - 230v Copy` | Copy suffix; one quotation line | Verify identity, then correct the display name if legitimate |
| Switch Socket Unit / `16A ... Direct Entry ... Copy` | Copy suffix; no relational business usage or checked draft usage found | Compare with existing configurations, then retain as a real direct-entry configuration or retire if equivalent |
| Stop Forward Reverse / `3 Entry` | Saved cable entry still says two entries | Verify and correct the entry count |
| Temperature Indicator / `Enclosure - 3 Entry` | Saved cable entry still says two entries | Verify and correct the entry count |
| DOL Starter / 1–10 HP variants | All six share checked fields; horsepower field is blank | Preserve real horsepower distinctions and populate structured horsepower |
| 420 × 420 Panel Box / four height variants | Height differences appear in names but checked dimension fields are blank | Preserve distinct heights; record full dimensions consistently |
| Ground Earth Detector; IIC Cable Gland; Rotary Switch Fitting | Product is active but every child variant is inactive | Decide whether to retire the family or restore a verified current configuration |

The source records and variant IDs are available in `tmp/catalog-audit-data.json` and `tmp/catalog-analysis.json`. Audit data stays local and is ignored by Git.

Cross-product comparison candidates include `Hand Lamp Fitting` versus `Hand Lamp Fitting -Multi Led Type`, `Rotary Switch` versus `Rotary Switch Fitting`, ET/SS/Metric/NPT cable gland families, related panel box families, and overlapping bulkhead/floodlight families. These are investigation candidates, not approved merges. Hand-lamp type numbers and rotary-switch terminal descriptions differ; torch families have different saved gas-group claims. Preserve these differences until verified.

## Consistent rules for the catalog

Keep three levels: **Category → Product → Variant**.

**Category** answers “what kind of equipment is this?” Use stable category names and correct obvious misclassifications. Examples needing review include a NON FLP Exhaust Fan in Flameproof Fans, a NON FLP RTD Sensor in Flameproof Fire Alarm, and a panel box in Flameproof Junction Boxes. Keep genuine business categories such as Petcoke if they are intentionally part of sales. Do not force an arbitrary category count.

**Product** is a family whose shared technical statements are true for every variant. In the current schema, material, protection, gas group, certification, finish and other attributes live on the product. For the first cleanup, use separate families when those statements differ. For example, material-specific cable gland products avoid a stainless variant inheriting a brass description. Broader grouping can follow only after all affected forms, selectors, document snapshots and public views support explicit variant attributes.

**Variant** is a repeatable configuration that users can accurately select, quote, order and supply again. Keep separate variants where power, dimensions, voltage, material/construction, thread, pin/entry count, components, function or manufacturing requirements differ. A new price, customer name, discount, PO reference, spelling or presentation requirement does not by itself need a new master variant.

Use document-level fields for customer-specific wording and pricing. Where customization changes what is physically supplied, either retain a distinct reusable variant or introduce an explicitly approved custom configuration; avoid disguising a physical change as a description edit that still consumes the old BOM.

Use predictable family-specific names, for example:

| Family | Suggested variant display pattern |
| --- | --- |
| Well Glass Fitting | `45 W / 230 V / Multi LED 5050 / Hanging` |
| Switch Socket Unit | `16 A / 230 V / 3-pin / 2-entry` |
| Exhaust Fan | `18 in / 230 V`, with phase and motor attributes recorded when applicable |
| Panel Box | Full `width × height × depth mm`, plus closure/configuration where relevant |
| Cable Gland | Verified thread standard and designation, construction and material where not fixed by parent |
| RTD Sensor | Probe diameter, probe length, lead length and sensor configuration as applicable |

These are display conventions, not verified specifications for every existing record. In particular, do not equate metric, ET and NPT labels or infer thread interchangeability from similar numbers.

Retain established valid SKUs. New SKU generation should be deterministic and based on approved identity attributes or a stable allocated code; preserve numeric distinctions such as decimal powers and fractional thread sizes. Renaming display text should not force a new SKU. Legacy names and codes can remain searchable aliases after review.

## Recommended implementation order

### 1. Protect historical output and expose active records correctly

Before any bulk correction or renaming, ensure issued quotation, customer order, work-order and invoice copies use saved identity, specification, component and media snapshots. Preserve existing stored values. For older records missing snapshots, recover from original documents or verified historical sources where possible; copying today's catalog values cannot prove the original issue state. Keep a documented legacy fallback where recovery is incomplete.

Filter new-item selectors to active variants under active, unarchived products and appropriate categories. Continue loading the exact inactive/archived IDs already attached to saved drafts and orders. Existing fulfillment must remain possible through its original document context, while retired records are excluded from fresh item selection. One checked quotation draft already contains an inactive Rotary Switch Fitting variant.

Apply equivalent eligibility checks on the server when adding a genuinely new selection. Avoid a blanket rule that prevents invoicing an existing order merely because its master item was later retired.

### 2. Define identity templates and prevent new clutter

Start with a few high-usage families: well glass, switch/socket, cable glands and panel boxes. Use relevant required fields, correct placeholders and controlled units/options. Record only valid configurations; do not generate every possible Cartesian combination of options.

Before a create request is submitted, show close existing matches and pending requests, with an explicit “use existing” action. Owner approval should show a comparison with the closest existing variant and require the requester to explain the actual difference. Repeat identity checks during approval because records can change while requests are pending.

Use normalized names and SKUs for exact duplicate protection. For well-specified families, enforce a unique normalized configuration key scoped to the appropriate product/family. Include every identity-defining attribute, including construction/function and material or certification scope where applicable. A generic hash of today's copied free-text fields would incorrectly block legitimate variants. Incomplete records should require review instead of claiming a reliable identity match. Enforce exact identity constraints transactionally to prevent concurrent approvals from creating duplicates.

Keep the duplication shortcut useful, but treat the result as a draft template: require a real changed identity attribute, show carried-over values, and prevent approval with `Copy`/temporary names. Do not use name change alone as evidence of a new configuration.

### 3. Prepare an owner review register

Each row should contain old product/variant ID, current name/SKU, proposed canonical name, canonical target ID if equivalent, decision, technical difference, evidence source, usage counts, draft references, serial/stock/BOM impact, reviewer and reason.

Use four decisions: **keep**, **correct**, **retire with equivalent replacement**, and **keep distinct**. Missing data or conflicting specifications remain unresolved review tasks. Choose the retained record using verified technical correctness and established usage; the newest record is not automatically the best one.

Only 11 variants under unarchived products had no relational business usage in the tables checked; eight were active under active products. None of those 11 appeared in the checked saved draft payloads. They still need identity and media/reference review; lack of sales does not make a legitimate configuration unnecessary.

### 4. Retire duplicates in small, reviewable batches

Retain existing records and historical links. Add an explicit replacement/equivalence mapping for proven duplicates and an audit record of who decided what and why. New search should find the retained item through verified old names/SKUs. Customer price lookup and analytics can include legacy IDs only when their equivalence is established. A different replacement product must not silently be treated as the same historical configuration.

Avoid physically deleting variants or repointing all historical foreign keys. Do not move a historically used variant to another product without accounting for every stored product/variant pair, drafts and serial associations. A retained canonical configuration and retired legacy record is usually safer than rewriting historical identity.

For a duplicate product with some unique valid variants, provide canonical counterparts for those valid configurations before retiring the parent. Archiving a product currently deactivates all of its variants. Preserve established public slugs where possible; if a public page is retired or renamed, provide an explicit redirect to its verified replacement.

The current absence of finished-good stock and manufacturing BOMs reduces migration complexity for this snapshot. Recheck immediately before each batch. If stock exists later, use reconciled, traceable stock movements with reservations handled; never simply add balances and delete old rows. Preserve original serial numbers, product associations and counters, especially for Square Bulk Head Fitting.

### 5. Verify the unchanged business flow

Use representative records to verify new quotation → order → invoice, old quotation/order reprints, work-order drawings, old-order fulfillment with retired variants, saved draft reopening, customer last-price lookup, serial assignment and public links. Confirm normalized duplicate prevention under concurrent approvals, legitimate differing variants, and spelling/unit variants. Compare before/after document snapshots and relational counts; expect no unintended changes to historical quantities, prices, totals or serials.

Take a recoverable database backup before cleanup, export the approved mapping, dry-run the batch and retain an undo plan. Re-run inventory and reference checks at execution time. Do not automatically apply the 24 identical-field groups as merges.

## Appendix: identical saved specification groups

All entries below require review. Most describe real distinctions that are missing from the structured fields, so this list must not be used as a deletion list.

| Product | Variants sharing checked fields and component text |
| --- | --- |
| DOL Starter | 1 HP; 2 HP; 3 HP; 5 HP; 7.5 HP; 10 HP |
| ET Cable Gland | 16mm ET; inactive 16mm IIC; 19mm ET; 19mm brass nickel plated; 19mm SS |
| ET Cable Gland | 25mm ET; 25mm SS; inactive M25 |
| ET Cable Gland | 32mm ET; 32mm SS |
| Tubelight Fitting | 20W; 25W |
| Limit Switch | Long Lever; Proximity Sensor; Roller Type; Short Lever; magnetic |
| 420 × 420 Panel Box | 120mm; 174mm; 210mm; 225mm height |
| Junction Box – 250 Dia | Bolting Type; Threaded |
| Digital Clock | 6 Digit; Clock; inactive Enclosure For Clock |
| Panel Box 680 × 525 | X 200; X 300 |
| Temperature Indicator | Enclosure – 2 Entry; Enclosure – 3 Entry |
| Earthing Relay | Classic Type; Earth Loop Monitoring Systems; Neotype |
| Spare Driver | 80W; 100W; 150W Multi 5050 |
| Local Control Station | 280 × 220 × 160; 320 × 220 × 170 |
| Spare Switch | 16A 230V; 32A 415V; 4 POSITION SELECTOR SWITCH; Limit Switch |
| Stop Forward Reverse | 2 Entry; 3 Entry |
| Junction Box 350Dia | Bolt-in; Threaded |
| 525 × 525 Panel | 200mm; 300mm |
| Exhaust Fan | 18 in 230V; 24 in 230V |
| Exhaust Fan | 18 in 415V; 24 in 415V |
| Spare LED | 30W Multi 5050 Monochromatic; 30W COB |
| Spare LED | 45W Multi 5050; 45W Multi 5050 RED; 45W COB |
| Rotary Switch | 16A – 2 Entry; ON-OFF-ON |
| Touch Switch | Double Switch; Single Switch |

## Primary implementation references

- Models: `prisma/schema.prisma` (`Product`, `ProductVariant`, document item snapshots, stock, BOM and serial models).
- Creation/edit approval: `src/lib/actions/dashboard/products/`, `src/lib/products/approval.ts`, `src/lib/actions/superadmin/productApprovalActions.ts`.
- Duplicate form and SKU generation: `src/components/dashboard/product/ProductVariantForm.tsx`, `src/lib/helpers/globalHelpers/normalizeSlug.ts`.
- Selection and visibility: `src/lib/actions/dashboard/global/product/searchProductVariantsForSelect.ts`, `src/lib/marketing/catalog.ts`.
- Archival: `src/lib/actions/dashboard/products/DeleteProduct.ts`, `src/lib/actions/dashboard/products/ToggleStatus.ts`.
- History-sensitive rendering: `src/components/customerCopy/quotation/QuotationItemTable.tsx`, `src/components/customerCopy/sales-order/WorkOrderItemTable.tsx`, `src/components/customerCopy/sales-order/WorkOrderCopy.tsx`.
- Customer pricing: `src/lib/actions/dashboard/sales/quotation/getCustomerLastVariantPricesAction.ts`.

Local evidence: `tmp/catalog-audit.cjs`, `tmp/catalog-audit-data.json`, `tmp/analyze-catalog.cjs`, `tmp/catalog-analysis.json`, `tmp/catalog-draft-audit.cjs`, `tmp/catalog-audit-extra.json`. Database queries used read-only transactions and aggregate business references without exporting customer contact or pricing data.
