# Catalog names applied on 19 November 2026

Applied to the database configured for this checkout: **93 product display names and 259 variant display names**. Another 63 reviewed labels already matched. Archived/inactive records and proposals requiring technical confirmation were held, covering 142 product/variant records. The exact applied changes and hold reasons are in [the application record](data/catalog-display-names-applied-2026-11-19.json).

## Old documents and new selections

The original `Product.name` and `ProductVariant.variant` values remain intact. Current labels live in the new nullable `displayName` fields. Catalog lists, product editing, sales selectors, gallery and public catalog/PDF read the current labels with the original values as a fallback. Searches match both old and new names.

Existing quotation, order, invoice, challan and draft item descriptions were not rewritten. Conversion continues to copy the source document's stored item titles. Work orders and production/pending-order labels now use those saved titles, so a new order converted from an old quotation continues to use the old quotation's wording. Fresh catalog selections copy the new label into the new document item.

Saved selections in quotation, order, invoice and delivery-challan editors display their stored item titles. Reopening a draft does not replace its title with the newly fetched catalog label. Explicitly choosing a different catalog item continues to populate the chosen item's current description.

SKU, type number, product/variant ID, serial number, price, quantity, tax, technical specification, component list, media, stock and historical relationships were preserved. Product slugs were preserved, and editing a product display name no longer automatically changes its existing public slug.

New serial batches save a product-name snapshot. Existing serials have no new snapshot populated and continue to show their original linked product label. Existing serial numbers and counters remain intact.

Fresh search results exclude inactive variants and inactive/deleted parent products. Existing saved selections still resolve by ID, including inactive records, without changing their stored lines.

## Schema and repeatability

Migration: `20261119090000_catalog_display_names`.

- Nullable display names on products and variants.
- Nullable product-name snapshot on serials.
- A database unique index on the normalized current variant name within its existing product.
- Approved future product/variant name edits write the display name, preserving the original historical fallback.

The reviewed input mapping is [catalog-name-proposals-2026-11-19.json](data/catalog-name-proposals-2026-11-19.json). `scripts/apply-catalog-display-names.cjs` supports a rolled-back dry run and an explicit `--apply` execution. It checks expected original labels and parent IDs, preserves archived/inactive and held records, and refuses conflicting later display-name changes. Re-running it does not duplicate data.

## Verification

The application transaction compared full-row checksums before and after for 29 related tables, including quotation/order/invoice headers and items, saved drafts, components, media, stock, serials and approval requests. All original row counts and checksums matched. Product and variant checksums also matched after excluding only the new display-name columns. For serials, the comparison excluded only the new, unpopulated snapshot column. No legacy business field was changed.

All 26 focused catalog/approval tests passed. Tests cover current names in the real selection actions, retained historical descriptions, inactive saved selections, original SKU/specifications, and future approved edits preserving original labels. Read-only checks using the actual configured database confirmed that the real selector and public catalog return the reviewed names while the real quotation and sales-order readers return the original names, titles, quantity and price.

TypeScript checking and Prisma schema validation passed. Application changes are in this checkout; no hosted deployment or Git push was performed.
