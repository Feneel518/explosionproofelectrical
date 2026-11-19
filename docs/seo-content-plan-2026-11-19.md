# Flameproof SEO research and eight buyer guides

Research date: 19 November 2026. Target: Indian industrial buyers, electrical engineers and EPC procurement teams. Brand: Explosion Proof Electrical Control (ExEC), Vapi, Gujarat.

## What the competitor review established

This is a public-page content and on-page SEO review, not a paid keyword-volume, backlink or market-share audit. These are established sector competitors used as benchmarks; their relative rankings and organic traffic have not been measured. Search results vary by location and time.

| Benchmark and source | Observed evidence | Application for ExEC |
|---|---|---|
| [FCG Power junction boxes](https://fcgpower.com/junction-terminal-boxes.html) | Descriptive product-family title, H1, description and self-canonical in fetched HTML; product content differentiates zone, gas group, IP and material. | Specific junction-box buying guide connected to the existing product category; selection tables and entry/terminal requirements. |
| [Sudhir Switchgears](https://www.sudhirswitchgears.in/about-us.php) and [local control stations](https://www.sudhirswitchgears.in/switchgears-local-control-station.php) | Navigation exposes detailed product families including wellglass, floodlight, control stations, switch sockets and cleanroom fittings. The sampled control-station HTML has a generic company title; do not copy that weakness. | Distinct product-focused article titles and links into the matching ExEC categories. |
| [Flametech](https://flametech.co.in/) and [cleanroom fittings](https://flametech.co.in/flameproof-clean-room-fitting/) | Named product-family navigation, cleanroom specialization, brochure and enquiry links. Sample homepage has a self-canonical but a generic title. | Pharma cleanroom guide and clear application-specific enquiry links. |
| [R. STAHL downloads](https://r-stahl.com/en/global/support/downloads/) and [blog](https://r-stahl.com/en/global/explosion-protection-blog/) | Technical education, product resources and application content connected within the manufacturer site. [Cleanroom article](https://r-stahl.com/en/global/blog/post-detail/clean-room-luminaires-need-triple-qualification/) separates lighting, cleanroom and explosion-protection requirements. | Practical comparison articles, examples and decision checklists. Web search could read these resources; a direct fetch of the cleanroom page returned a 403 maintenance page, so no claim about its current HTML metadata is made. |
| [Eaton LED design guidance](https://www.eaton.com/in/en-us/products/lighting-controls/hazardous-area-lighting/system-design-requirements-for-reliable-led-lighting-in-harsh-an.html) | Technical design content organized around application factors; descriptive title and canonical verified in fetched HTML. | Lighting article compares photometry, installation, environment and maintenance instead of wattage alone. |

The opportunity inferred from these pages is to connect useful technical buying information to ExEC's existing commercial catalog. A competitor using a tactic does not prove that tactic caused its rankings. The implementation uses original writing, existing ExEC assets and explicit reference links.

## Keyword and URL map

Priorities reflect product fit and buyer intent, not measured search volume or difficulty. Primary keywords appear in the article topic, heading/title or close natural variants. Secondary terms support the same intent. Product categories retain the main transactional manufacturer/product-family intent; guides serve selection, comparison and specification intent.

| Priority | Primary keyword | Supporting terms | New article path | Commercial destination |
|---|---|---|---|---|
| 1 | flameproof junction box selection | flameproof terminal box; IIC junction box; cable entries | `/blog/flameproof-junction-box-selection-guide` | `/catalog/category/flameproof-junction-boxes` |
| 1 | flameproof LED wellglass vs floodlight | flameproof LED lighting selection; hazardous area lighting design | `/blog/flameproof-led-wellglass-vs-floodlight` | `/catalog/category/flameproof-lighting-fittings` |
| 1 | flameproof control panel specification | flameproof panel RFQ; hazardous area control panel | `/blog/flameproof-control-panel-specification-checklist` | `/catalog/category/flameproof-panels` |
| 2 | flameproof local control station | flameproof start stop push button; control station specification | `/blog/flameproof-local-control-station-selection` | `/catalog/category/flameproof-switch-gears` |
| 2 | flameproof cleanroom lighting | pharmaceutical plant lighting; clean room light fitting | `/blog/flameproof-cleanroom-lighting-pharmaceutical-plants` | `/catalog/category/flameproof-clean-room-lighting-fittings` |
| 2 | flameproof equipment RFQ checklist | flameproof equipment supplier India; manufacturer evaluation | `/blog/flameproof-equipment-rfq-checklist-india` | Relevant catalog families and `/contact-us` |
| 2 | flameproof switch socket selection | flameproof plug and socket; interlocked socket | `/blog/flameproof-switch-socket-selection-guide` | `/catalog/category/flameproof-switch-gears` |
| 2 | double compression vs barrier cable gland | single vs double compression; flameproof double compression cable gland | `/blog/single-double-compression-barrier-cable-glands` | `/catalog/category/flameproof-accessories` |

Existing explanatory pages about zones, gas groups, temperature classes, Ex d, certification and general gland selection are linked as supporting references. They were not duplicated. The gland comparison resolves quotation terminology while the existing knowledge page retains general gland-selection intent.

## Implementation

- Eight substantial articles, about 6,000 words total before rendering, with distinct excerpts, SEO titles, descriptions, keywords and relevant image alt text.
- Practical tables, enquiry inputs, illustrative examples explicitly identified as such, common buyer questions and conversion links.
- Model-specific product links and category links checked against the connected active catalog.
- Existing CMS publication model retained: articles are database records, editable and unpublishable through the dashboard. No permanent fallback republishes a removed article.
- New publication script defaults to a dry run. Explicit `--publish` creates missing guides in a transaction and preserves every pre-existing blog record. It never overwrites CMS edits on rerun.
- Existing blog listing, article metadata, canonical, Open Graph, Twitter, table of contents, related posts and sitemap mechanisms serve the new records automatically.
- Category-to-guide navigation added in source, filtered by the current published posts so drafts and unpublished records are not linked.
- Article JSON-LD improved in source with section, language and keywords; remote cover-image URLs remain valid instead of being prefixed with the site hostname.
- Root title template already adds `| ExEC`; new SEO titles omit a second brand suffix.

The source changes to category navigation and JSON-LD need a normal application deployment. Database publication can appear immediately on an existing deployment because blog routes read published records dynamically. The existing sitemap reads published records too, but its production cache must be checked separately.

## Technical references used in writing

- [IEC 60079-14:2024 scope](https://webstore.iec.ch/en/publication/66049): installation design, selection, installation and initial inspection. Project-adopted editions and equipment instructions still govern a specific installation.
- [PESO official FAQ](https://www.peso.gov.in/web/en/faqs-under-various-heads): jurisdiction of electrical-equipment approval; no blanket claim that every industrial site has identical requirements.
- [PESO circular, 10 September 2025](https://www.peso.gov.in/web/sites/default/files/2025-09/CIRCULAR_10-09-2025.PDF): conditional approval-validity extension, rather than an oversimplified expiry-date test.
- [IECEx public verification](https://www.iecex.com/our-impact-and-initiatives/who-benefits/) and [OD 009](https://www.iecex.com/dmsdocument/1598/): certificate verification, specific conditions of use and component limitations.
- [CMP sealing methods](https://www.cmp-products.com/us/en-us/cable-glands/technical/explosive-atmospheres/flameproof-sealing-methods/): distinction between sealing constructions.
- [Eaton cable and gland paper](https://www.eaton.com/content/dam/eaton/markets/oil-and-gas/knowledge-center/whitepaper/cables-and-cable-glands-for-hazardous-locations.pdf): cable compatibility background, not a substitute for current product instructions.
- [Eaton optics guidance](https://www.eaton.com/gb/en-gb/products/lighting-controls/hazardous-area-lighting/led-optics--light-quality-and-lenses.html): task illumination, optics and glare.

No certification number, approval, laboratory result, customer installation, payback claim or performance promise was invented for ExEC. Existing product images are illustrative; a category label or image does not demonstrate suitability for an application.

## Validation and measurement

Run `npx tsx scripts/publish-buyer-guides.ts --dry-run` to validate source article lengths, unique topics/slugs, metadata, image existence, category mappings and every internal content link against published resources and active catalog entries. Use `--publish` to create the eight missing posts. Review TypeScript and ESLint for the changed source files.

Verify production HTTP 200 responses, canonical URLs, descriptions, article schema, archive discovery and sitemap inclusion after publication. Local source changes require deployment before they can be checked on production.

Search Console and analytics access were not available for this implementation. After indexing, compare article impressions, relevant queries, clicks, CTR and enquiries over comparable 28-day windows, segmented by article and country. Record an actual baseline before claiming uplift. Keyword metadata is descriptive organization only: [Google does not use the meta-keywords tag for rankings](https://developers.google.com/search/docs/crawling-indexing/special-tags). Titles, useful content and crawlable links follow [Google Search Essentials](https://developers.google.com/search/docs/essentials). No ranking or traffic improvement is guaranteed.

### Cover image refresh

Replaced the reused graphics on all eight buyer guides with eight distinct images generated using the built-in image generation tool. Topics: junction enclosure, wellglass/floodlight installation, control panel, local control station, pharmaceutical cleanroom, specification workspace, switch socket and cable glands. These are illustrative editorial visuals, not photographs of actual ExEC equipment or installations. Each cover is 1536 × 1024, exported as an optimized WebP (approximately 124–212 KB) and uploaded to the existing UploadThing storage. Descriptive alt text was updated with each cover; article content and publication status were preserved. Local copies are in `public/marketing/blog/`. The asset manifest, source filenames and prompt set are in `docs/data/blog-cover-manifest-2026-11-19.json`; the prior live cover values are backed up in `outputs/seo-2026-11-19/covers-before-v2.json`. All eight live article pages contain the replacement URL and alt text; all eight stored images and all eight Next.js optimized image requests returned HTTP 200. ESLint and the article source dry run passed. Evidence: `outputs/seo-2026-11-19/cover-verification.json`.

### Publication results

- Published all eight new records on 19 November 2026; the publisher confirmed that the three existing database articles were unchanged.
- Source validation passed: 6,032 whitespace-delimited words across the eight articles; unique primary keywords and slugs; all internal article links, category mappings, cover assets and metadata checked.
- Production verification: all eight article URLs returned HTTP 200 with the expected H1, unique title, canonical URL, description and existing BlogPosting schema.
- Production sitemap returned HTTP 200 and included all eight new URLs. Archive returned HTTP 200; its initial visible cards contain six of the new articles, with the remaining articles available through the archive controls and sitemap.
- ESLint passed for the four changed TypeScript/TSX files. The full TypeScript check did not complete within the verification window while multiple independent compiler checks and other work were active in this shared checkout; it is not reported as passed.
- Machine-readable HTTP evidence saved to `outputs/seo-2026-11-19/live-verification.json`.
- Browser verification attempts timed out in the local environment. HTTP and rendered HTML were verified; desktop/mobile screenshots and browser interaction checks are not claimed as passed.
