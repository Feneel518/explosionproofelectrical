# System review — 18 November 2026

This is the original audit snapshot. Its prioritized findings have since been addressed; see [the remediation and validation record](system-integrity-fixes.md) for current behavior, migration status and deployment configuration.

## Assessment

The repository already implements a broad business system: public catalog and content, enquiries, quotations and follow-ups, orders, delivery challans, invoices, purchasing and GRNs, inventory ledgers and returns, BOM-based planning, casting jobs, contractors and payouts, serial tracking, product approvals, Gmail, and website analytics. The next investment should make these flows reliable and connected before adding more independent screens.

Release readiness: changes are needed before treating the current checkout as a release candidate. The most important findings concern exposed server actions, document access, financial calculations, concurrent stock changes, and payroll balances.

This is a review of the current working tree, including existing uncommitted work. It is not a diff review against a previous release. No business implementation was changed. Prisma Client was regenerated locally for validation; no database migration was applied. A mocked diagnostic was added under `tmp/`; run `node tmp/system-review-repro.cjs` to reproduce the two concurrency interleavings without a database.

## Verification and limits

| Check | Result |
| --- | --- |
| TypeScript before client generation | Failed with 17 diagnostics, including missing READY enum values |
| Prisma Client generation | Passed; resolved READY-related diagnostics |
| TypeScript after generation | Failed with 5 diagnostics in scripts/gmail-sales.integration.ts |
| ESLint over src | Failed: 366 errors and 170 warnings; generated files excluded from the reported source totals |
| Gmail and quotation tests | 17 passed, including authenticated PDF rendering and duplicate-send handling |
| Product approval tests | 20 passed |
| Mocked concurrency reproductions | Reproduced lost stock update and two accepted autosaves using the same version |
| Browser | Homepage at desktop size; catalog and product detail at 390px width; product search returned filtered results; anonymous dashboard navigation reached sign-in |
| Design detector sample | Returned no findings for sidebar, auth components and globals.css; this is not evidence that the entire UI is accessible |

The first test/dev-server attempts were blocked by sandbox child-process restrictions. Retrying outside that restriction succeeded. These environment failures are not product defects.

Authenticated dashboard flows were inspected in source, not exercised against live business records. No real email was sent, payroll posted, invoice finalized, or stock changed by the review. A full production build, production logs, database migration state, backup restoration, load testing, dependency vulnerability scan, physical-device touch testing, and full accessibility audit were not verified.

## Fixes, in priority order

### 1. P1 — Guard every exported server action; make internal mail helpers private

**Evidence:** `src/lib/actions/emails/send-emails.action.ts:9` exports a generic sender from a `use server` module. It accepts recipient, subject and link without authentication or rate limiting. It is also present in the existing build's server-reference manifest. Dashboard overview, monthly trends, website analytics and order analytics also export actions without authentication checks:

- `src/lib/actions/dashboard/getDashboardOverviewAction.ts:109`
- `src/lib/actions/dashboard/getDashboardMonthlyTrendsAction.ts:47`
- `src/lib/actions/dashboard/getWebsiteVisitorAnalyticsAction.ts:99`
- `src/lib/actions/dashboard/sales/order/analytics/getOrderDashboardAnalytics.ts:59`

**Impact:** The protected dashboard layout does not protect separately callable actions. The sender presents a mail-abuse risk; analytics actions expose internal commercial information if invoked directly. No exploit email was sent during this review.

**Fix:** Move the generic sender to an internal server-only module with no exported Server Action endpoint. Keep public verification/reset workflows purpose-specific and throttled. Enforce session and permission checks inside each dashboard action or its data access boundary. Add direct unauthenticated-action tests.

Framework rationale: [Next.js data security](https://nextjs.org/docs/app/guides/data-security) documents direct POST access to exported actions and the need for authentication inside each action.

### 2. P1 — Protect purchase-order copies and keep drafts private

**Evidence:** `src/app/(customerCopy)/purchase-orders/[id]/page.tsx:18` reads a purchase order by ID without authentication, an expiring sharing token, or a status restriction. The shared layout only supplies noindex metadata. Middleware protects dashboard/superadmin, not this path.

**Impact:** Anyone possessing the URL can read the PO, including drafts or cancelled documents. UUIDs reduce guessing but do not provide revocation, expiry, or recipient access control.

**Fix:** Require staff authentication for internal print views. For supplier sharing, use a scoped, revocable, expiring token, restrict eligible statuses, and share an approved document revision.

### 3. P1 — Stop inventing a protection marking from gas-group data

**Evidence:** `src/lib/marketing/catalog.ts:292` extracts gas-group strings and formats them as `Ex d ...`, regardless of the actual protection concept. The wellglass page displayed `Ex d IIA/IIB/IIC` alongside Zone-0/1/2 in the browser. The certification documents were not available for verification.

**Impact:** Gas group alone does not establish an Ex protection concept or approved zone. The formatter can misrepresent catalog data. This review does not conclude whether an individual product is or is not certified for a particular application.

**Fix:** Store and display the exact approved marking, EPL, gas/dust group, temperature class, ambient range, certificate number/revision and permitted zones. Link claims to the actual certificate and require technical review before publication. Do not automatically relabel existing products without checking the source documents.

Primary reference: [IECEx zone and equipment protection level guidance](https://www.iecex.com/dmsdocument/4336/) lists Zone 0 with Ga and Zone 1 with Gb or Ga. An `Ex d` label generated from a gas group cannot establish that evidence.

### 4. P1 — Calculate invoice money on the server

**Evidence:** `src/lib/actions/dashboard/sales/invoice/finalizeInvoiceAction.ts:430` copies subtotal, taxable total, GST and grand total from draft headers. Line GST is also taken from the draft. `saveInvoiceDraftSnapshotAction.ts` stores the typed object without runtime schema validation. `updateInvoiceDraftData.ts` likewise accepts totals from its payload.

**Impact:** A stale form or modified request can create a finalized invoice whose totals disagree with its items. TypeScript types do not validate incoming requests.

**Fix:** Validate the payload at runtime; calculate prices, discounts, taxes, charges and rounding with a shared server-side money calculation; derive header totals from validated lines. Test inconsistent totals, rounding boundaries and invalid quantities.

### 5. P1 — Make stock movements safe under concurrency

**Evidence:** `src/lib/helpers/inventory/postStockMovement.ts:112` reads stock, computes a balance in JavaScript, then writes an absolute value at line 124. Casting receipt posting calls this helper inside a transaction without the Serializable options used by several other finalization actions (`postCastingJobReceiptAction.ts:174`).

**Reproduction:** Two mocked concurrent receipts, starting at 10 and adding 5 and 7, produced two ledger entries totalling 12 but an on-hand balance of 17 instead of 22. This reproduces the permitted read/update interleaving; it was not a live database stress test.

**Fix:** Lock each affected balance or use a suitable atomic update and conditional availability check. Re-read receipt/job limits within the same protected transaction. Handle serialization conflicts with bounded retries and add operation idempotency. Verify using concurrent transactions against an isolated test database.

### 6. P1 — Make autosave conflict detection atomic

**Evidence:** Invoice and quotation snapshot actions first read and compare `draftVersion`, then update using only the document ID. See `saveInvoiceDraftSnapshotAction.ts:29` and `saveQuotationDraftSnapshotAction.ts:29`.

**Reproduction:** Two mocked saves both submitted clientVersion 1; both returned success, and the document reached version 3. The second draft replaced the first.

**Fix:** Include ID, DRAFT status and expected version in the update predicate. Treat zero updated rows as a conflict. Apply the same pattern to other draft documents and transitions. Preserve the unsaved client draft for recovery.

### 7. P1 — Repair payout transactions and advance carry-forward

**Evidence:** `src/lib/actions/dashboard/contractors/payouts/SettlePayout.ts:76` upserts the payout, then separately deletes old payout ledger entries and creates a replacement at lines 109 and 117. There is no encompassing transaction. At line 73, carryForward is recorded, but later monthly calculations only read the current month's entries; repository search found no consumption of a previous payout's carryForward.

**Impact:** A failed ledger write can disagree with the saved payout. Deferred advances disappear from future settlement calculations. When advances exceed earnings, the calculation clamps net payable to zero without preserving the remaining advance balance in this path.

**Fix:** Settle the payout and ledger as one transaction. Track advance opening balance, issued amount, applied amount and closing balance explicitly. Preserve payment history instead of replacing it. Test unpaid advances, partial repayment, excess advances, retries and settlement edits.

### 8. P1 — Restore a clean release check

**Evidence:** After Prisma generation, scripts/gmail-sales.integration.ts still imports missing `salesDraft`, `orderPdfDraft` and `orderPdfSchema` modules at lines 4, 5 and 7 and has two resulting inference diagnostics. The root TypeScript configuration includes scripts, so these are part of the configured type check. Documentation describes Gmail draft/PDF import workflows that are absent from the current implementation inspected.

**Fix:** Finish the intended modules/workflow or remove the stale imports and inaccurate feature documentation. Do not suppress these diagnostics to present an incomplete workflow as complete. Add typecheck and test package scripts and a CI pipeline. Use the declared pnpm package manager consistently; the repository currently carries both npm and pnpm lockfiles.

The lint backlog is mostly explicit any, unused variables and empty interfaces, with several React hook findings. Prioritize behavior and type boundaries first, then clean the baseline and prevent new failures.

### 9. P2 — Preserve invoice identity and address snapshots

**Evidence:** `src/app/(customerCopy)/invoices/[id]/view/page.tsx:31` rebuilds company/address/contact fields from the current sales-order customer. Several addresses are not snapshotted on the invoice schema at all.

**Impact:** Changing customer master data can change a reprinted historical invoice. Offline invoice copies can also lose fields when no sales order is attached.

**Fix:** Capture a complete billing/shipping/contact snapshot when finalizing and render it consistently. Keep a document revision or immutable issued PDF when corrections are required.

### 10. P2 — Replace implicit access with explicit staff permissions

**Evidence:** requireAuth checks a dashboard email allowlist, not action permissions. The hard-coded fallback email is always included even when DASHBOARD_ALLOWED_EMAILS is configured (`dashboardAccess.ts:16`). Inventory-specific restrictions allow all dashboard users when both inventory lists are absent. Stronger owner checking already exists for product approval.

**Fix:** Define Sales, Stores, Purchase, Accounts, Production, Manager and Owner capabilities. Enforce them at action boundaries, especially payments, adjustments, approvals and finalized-document changes. Make the owner/allowlist policy explicit and configurable, with removal and session-revocation behavior.

### 11. P2 — Make enquiries durable and resistant to spam

**Evidence:** `contactActions.ts` sends product enquiries only by SMTP; these do not create a durable lead. The separate quote-inquiry action does save a quotation, so persistence differs by entry point. No application-level throttle or challenge was found for these public form handlers or the analytics visit writer. Infrastructure-level controls were not inspected.

**Fix:** Save every enquiry into a consistent lead queue before delivering notifications, add deduplication and submission limits, and queue/retry failed mail. Keep spam records out of the quotation numbering sequence until reviewed.

### 12. P2 — Improve fractional materials and mobile enquiry continuity

**Evidence:** VariantBomItem.qtyPerUnit is Int and the BOM validator requires at least one whole unit. It cannot describe 0.25 kg of aluminium or 0.5 m of wire. Invoice consumption also truncates BOM and invoice quantities. Separately, the product page's bottom mobile Enquire link goes to `/#contact`, while the main quote control correctly includes the chosen variant.

**Fix:** Use decimal BOM quantities with explicit units and consistent conversion/rounding rules. For mobile, open the same variant-aware enquiry control as the product's primary action. Give product images descriptive alt text rather than uploaded filenames.

## Features to add after the critical fixes

| Priority | Addition | Current gap and useful first release |
| --- | --- | --- |
| 1 | Customer receipts and receivables ledger | Invoice payment is a Boolean. Add partial receipts, advances, payment allocation, remaining balance, due dates and ageing buckets, with reversal history. |
| 2 | Supplier bills and payables | PO and GRN already exist. Add supplier invoice matching, payment allocations, outstanding balances, duplicate-bill checks and purchase returns. |
| 3 | Production work orders and WIP | Planning already calculates demand and shortages. Add order-linked jobs, material reservations, issue/return, operation progress, completion receipts, scrap/rework and responsible operators. Define whether consumption happens at production or invoicing to avoid counting the same material twice. |
| 4 | Quality and certificate management | Build on existing test-certificate output and serials. Record inspection results, failures, release approval, certificate scope/revisions, and serial/batch traceability. |
| 5 | Sales returns and credit notes | Material returns cover issued inventory. Add customer return authorization, inspection, restock/scrap decision, invoice adjustment and credit allocation. |
| 6 | Shared activity and approval history | Existing createdBy/updatedBy fields do not retain every change. Show actor, time, before/after values, reason and document revision for approvals, corrections, payments and stock changes. |
| 7 | Connected customer workspace | One customer timeline for enquiries, emails, quotes, orders, dispatches, invoices, receipts and follow-ups; add ownership, next action and lost-reason reporting. |
| 8 | Background jobs and operational alerts | Gmail/follow-up notifications currently depend on an open dashboard. Add a durable job queue for sync and delivery retries, scheduled due/low-stock/overdue alerts, with receipts and failure visibility. |
| 9 | Buyer specification tools | Existing catalog search and sharing work. Add filters for verified protection/zone/rating/material, product comparison, certificate/drawing downloads and a multi-product RFQ list. Selection guidance should use verified certificate data. |
| 10 | Mobile stock and serial scanning | Serial printing exists. Add scan-to-issue, receive, dispatch and traceability actions with explicit confirmation and duplicate-scan handling. |

Cross-cutting operations work: establish an isolated staging database, backup/restore drill, migration runbook, error reporting with request IDs, and health checks for database, mail and PDF generation. Hosting-level backups/monitoring may already exist; they were not visible in this repository review.

## Public UI audit coverage

The public pages have a coherent industrial visual system. Desktop homepage rendering, mobile catalog and product layout, search, labeled navigation, a skip link, and sign-in redirection worked in the sample. The 390px catalog had page width 390px, so no page-level horizontal overflow was measured there.

Accessibility is only partially checked: the product image used a filename as its accessible name; full contrast, screen-reader and keyboard coverage remain unverified. Performance needs production measurement: the homepage is force-dynamic and getCatalogData uses React request caching while fetching the full catalog. Consider cross-request caching/invalidation and smaller public data payloads; the slow local cold compile is not a production performance measurement. Theming appeared consistent on the sampled public pages. Physical-device gestures and authenticated dashboard responsiveness remain untested.

No whole-system numerical UI score is assigned from this limited visual sample.

## Suggested implementation sequence

1. Release and security: repair the incomplete script; remove unintended action endpoints; protect PO sharing; verify public product claims.
2. Correctness: centralize invoice calculations; fix stock and draft concurrency; repair payout and advance balances; preserve issued-document snapshots.
3. Controls: staff permissions, activity history, public submission limits, CI, deployment and restore checks.
4. Business value: receipt/payable ledgers, production jobs, quality/certificates, returns and buyer RFQs.

For interface follow-through, use `$impeccable harden` for permission/error/conflict recovery, `$impeccable adapt` for mobile enquiry continuity, `$impeccable optimize` after production profiling, and `$impeccable polish` after correctness and workflow changes. Re-audit the affected flows after each batch.
