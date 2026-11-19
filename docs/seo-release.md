# ExEC SEO release

Changes are in the `agent/seo-improvements` branch and the `exec-seo` checkout. The original checkout's uncommitted deletions were preserved.

## Implemented

- Suppress unsupported Zone 0 claims in website specifications, descriptions, schema and generated catalog PDFs. Preserve raw data for certificate review.
- Remove inherited hazardous-zone and gas-group claims from explicitly non-FLP and non-electrical products.
- Stop inferring Ex d protection from gas subgroup. Preserve restricted IIB + H2 markings. Display the IP rating separately from the erroneous IEC 60079-1 attribution.
- Remove the product form's preselected zones, gas groups, IP rating and protection declaration. Validate new submissions and owner approvals against the Zone 0 requirement.
- Resolve legacy `/product/...` URLs against current active products and explicit equivalent-product aliases, returning HTTP 301. Unknown or removed products return HTTP 404. Product identity must be preserved; changed sizes or protection ratings are not interchangeable redirect targets.
- Redirect `/about-us` to `/story` and `/contact-us` to `/contact` with HTTP 301.
- Strengthen the current `/catalog` page's metadata, structured collection data and crawlable product-family links. Filtered/search catalog URLs are `noindex, follow` and canonicalize to `/catalog`. Product variants retain their base product canonical.
- Publish twelve product-family landing pages, four industry application pages, a certification-document request and verification page, and two technical guides covering EPL and flamepaths.
- Connect Organization, WebSite, Product/ProductGroup, BreadcrumbList and page entities through stable IDs. Variant models and SKUs belong to their actual configurations. Pricing and reviews are not fabricated; product rich-result eligibility still requires Google's applicable supported fields.
- Include real public routes, categories, products, published posts and guides in a deduplicated XML sitemap. Exclude legacy redirect sources and private pages. Static modification dates describe this release rather than the time of each request.
- Add a `GOOGLE_SITE_VERIFICATION` environment variable for Search Console verification.

## Technical review still required

The read-only audit found unsupported Zone 0 declarations in all 128 active product records, 101 incorrect IP/standard associations and 10 non-FLP/non-electrical products carrying inherited hazardous-area declarations. See `product-seo-audit.json`. Suppression fixes public output; it does not certify a replacement marking or alter saved engineering records. A competent product owner must reconcile the records with actual certificates, type numbers and covered configurations.

For future updates, run `npm run seo:audit-products`. In environments where PostgreSQL TLS is unavailable but the database is Neon, use `npm run seo:audit-products -- --neon-http`. An exit code of 1 identifies outstanding technical issues or missing redirect targets; the script does not write to the database.

## Validation commands

```powershell
npm run seo:test-data
npx tsc --noEmit
npm run build
npm run start
npm run seo:validate
```

Set `SEO_TEST_BASE_URL` to the running server, such as `http://localhost:3100`. The default is `http://localhost:3000`. Set `NEXT_PUBLIC_SITE_URL` only to the site's canonical public origin. Use `npm run seo:validate -- --all` for a complete post-deployment sitemap URL crawl.

## Search Console after deployment

1. Verify the domain property through DNS, or add the URL-prefix property's supplied token as `GOOGLE_SITE_VERIFICATION` and redeploy.
2. Submit `https://www.explosionproofelectrical.com/sitemap.xml` in the verified property's Sitemaps report.
3. Inspect `/catalog`, a corrected product page, a category landing page and an industry page using URL Inspection's live test. Confirm the declared canonical, rendered product content and crawl access.
4. Inspect representative old `/product/...` URLs. Confirm their 301 destinations. Retain legacy redirects long term and reconcile additional historical URLs from Search Console, analytics or server logs with exact current equivalents.
5. Test a product and its breadcrumb with Google's Rich Results Test. Quote-only products intentionally have no invented offers, ratings or reviews. Structured entities alone do not guarantee rich results.
6. Request indexing of the principal hubs and corrected product pages. Monitor Page Indexing, sitemap processing and selected canonical URLs over subsequent crawls.
7. Use the Removals tool only if a rapid temporary hide of obsolete indexed content is necessary. Permanent cleanup comes from updated content, redirects, canonical signals, noindex or proper 404 responses as appropriate.

Search Console account verification, submission and Google indexing have not been performed by this local release. They require the site's verified property and deployed changes.

## Primary references

- [Google: permanent redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
- [Google: product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Google: sitemap and indexing limitations](https://developers.google.com/search/help/crawling-index-faq)
- [Next.js: metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js: sitemap files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [IECEx: protection techniques and marking](https://www.iecex.com/assets/Uploads/D2S2-Ex-Protection-Techniques-BARTEC.pdf)

## Next content work

The engineering article expansion is outlined in `seo-content-plan.md`. Publish reviewed, distinct articles with actual sources and relevant product links. Add downloadable model-specific certificates only after their scope and publication permission are verified. Publish case studies from documented projects and pursue relevant industry mentions through real relationships.
