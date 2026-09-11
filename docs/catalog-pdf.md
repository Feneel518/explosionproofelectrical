# Database product catalog PDF

The catalog page has a **Download full catalog PDF** button. It downloads
`GET /api/catalog/pdf`, which generates a fresh A4 PDF from the public catalog.
The export always includes the complete collection, regardless of on-screen filters.

The design follows the supplied `Explosion Proof Electrical Control.pdf`. Its
cover, welcome, company overview and process pages are preserved. The generated
category pages use the same vertical heading, large hero image and three-column
product layout. Each product card lists up to three variants with its type number
and rating. Larger variant sets continue into another card, so all active variants
remain visible. Contents, categories and product cards are clickable.

## Export locally

```sh
npm run catalog:pdf
```

Output: `output/pdf/ExEC-Product-Catalog.pdf` (ignored by Git).
The script reads the existing `DATABASE_URL`; it does not modify any records.
For networks that cannot establish PostgreSQL TLS to Neon:

```sh
npm run catalog:pdf -- --neon-http
```

The endpoint uses Prisma by default. Set `CATALOG_PDF_TRANSPORT=neon-http` to
use the same read-only Neon HTTPS transport on the server if needed. Both paths
include only active, non-deleted products in active, non-deleted categories,
and only active variants. The HTTPS query must stay in sync with the publication
rules and selected public fields in `src/lib/marketing/catalog.ts`.

## Assets and deployment

- Montserrat font files and their OFL license are bundled under `public/catalog/fonts`.
- The supplied company artwork is bundled as `public/catalog/reference-company.pdf`.
- Product images are read from the database. Remote fetches are restricted to the
  existing `z4zi8ouylj.ufs.sh` upload host, with redirects disabled, size limits and
  timeouts. Missing images receive an explicit text label; no stock image is invented.
- Product images are normalized and shared across pages where possible.
- The Node.js route has a 120-second runtime allowance. Downloads are not cached;
  concurrent requests in one server instance share the in-flight generation.
- `next.config.ts` includes fonts and company assets in the server function bundle.

## Verification

The September 11, 2026 export contains 147 published products and 356 active
variants across 79 A4 pages (approximately 9.4 MB). PDF text extraction confirmed
that every product and variant name is present. Checks found no text outside page
bounds and no text overlaps. All 20 contents links resolve to their displayed page,
and representative pages were rendered for visual review. Where the database has
no image, the reference layout's open image area is retained.
