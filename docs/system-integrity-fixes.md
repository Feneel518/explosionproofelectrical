# System integrity fixes — 18 November 2026

This records the remediation of the ten prioritized findings in `system-review-2026-11-18.md`. Existing Gmail and quotation work in the checkout was preserved.

## Implemented behavior

| Finding | Result |
| --- | --- |
| Exposed email and analytics actions | Generic authentication mail is an internal `server-only` utility. Analytics actions check authorization before reading data. Authentication and public submissions have database-backed limits. |
| Purchase-order URL access | Internal copies require purchase access. Supplier links contain a random token, expire after seven days, and can be revoked. Draft/cancelled documents cannot be shared. Editing, cancelling or replacing a link revokes the previous grant. Only the token hash is stored. |
| Invented certification labels | Gas-group text no longer generates an `Ex d` marking. Exact markings, certificate references and verification are stored separately. Unverified legacy markings and zone claims are suppressed in the catalog and export data. |
| Browser invoice totals | Server validation and a shared integer-paise calculator recompute line and header totals, discounts and GST. Finalization does not trust submitted totals. The editor uses the same calculator and submits parsed values. |
| Lost stock quantities | Every stock read/modify/write path takes a transaction-scoped entity lock. Availability checks, ledger insertion and balance updates use the same transaction. Conflicting serializable transactions are retried. |
| Autosave races | Document updates compare the expected version and status in the actual database update. Exactly one save wins for a shared version. Finalization claims the same version before side effects. Invoice attach/detach also use versions. |
| Contractor payout inconsistencies | Settlement calculations, payout and payment ledger records commit together. Excess/deferred advances and unpaid earnings carry forward. Payment retries append only the additional amount paid. Settled periods reject retroactive work/advance changes; generated payout history cannot be edited manually. |
| Gmail TypeScript errors | The integration script now targets existing conversation, delivery and attention APIs. It no longer imports nonexistent PDF-import modules. The unfinished PDF-import flow is documented as unshipped. |
| Changing historical invoices | Issuing an invoice stores customer identity, full address, tax identity and contact details. Customer copies and invoice readers use the frozen snapshot. |
| Permissions and enquiries | Actions and dashboard pages enforce domain permissions. Navigation reflects granted access. Website requests save a durable enquiry and email outbox atomically; numbered quotations are created only after staff review. Duplicate intake, submission limits, retry leases and a manual retry flow are implemented. |

## Migration

`20261118130000_system_integrity_controls` was applied successfully to the configured database. Prisma reported all 18 migrations applied and the schema up to date. The migration adds fields/tables and backfills snapshots for existing issued invoices; it does not delete business records.

Legacy snapshots use the best customer identity still available at migration time. They cannot reconstruct an address that had already been changed before this fix. Newly issued invoices capture identity at issuance.

Existing product records start without verified certification evidence. Enter the exact approved marking and certificate reference, check the supported zones against the certificate, then submit/approve the product change. This implementation does not assert that any existing Zone-0 claim is certified.

## Runtime configuration

All email lists below are comma-separated and case-insensitive. A user must have a verified email and pass `DASHBOARD_ALLOWED_EMAILS` before any department grant applies.

| Variable | Access |
| --- | --- |
| `DASHBOARD_ALLOWED_EMAILS` | Explicit dashboard allowlist. A nonempty configured list replaces the legacy fallback. |
| `DASHBOARD_OWNER_EMAILS` | Full access and product approvals. Explicit configuration replaces the legacy owner fallback. |
| `SALES_EMAILS` | Sales, lead review, quotation/order/challan actions. |
| `PURCHASE_EMAILS` | Purchase orders and supplier sharing. |
| `ACCOUNTS_EMAILS` | Invoices and contractor accounts; also sales read access. |
| `PRODUCTION_EMAILS` | Manufacturing and casting operations. |
| `INVENTORY_STOREKEEPER_EMAILS` | Stock movement, GRN and material-issue operations. |
| `INVENTORY_MANAGER_EMAILS` | Inventory operations plus adjustments, opening balances and posted GRN corrections. |
| `MASTER_DATA_EMAILS` | Master-data changes. Department staff receive master-data read access for selectors. |
| `CONTENT_EDITOR_EMAILS` | Website content changes. |
| `ANALYTICS_EMAILS` | Business and website analytics. |

The current database role is loaded for every authorized request. `OWNER` and `ADMIN` have full operational access; `MANAGER` has department access. Product approval additionally requires the owner email or `OWNER` role. Clients cannot assign their own role during sign-up. Keep ordinary staff as `USER`/`STAFF` with explicit department grants.

Notification delivery needs valid SMTP settings and `SALES_NOTIFICATION_EMAIL` (defaults to the established business inbox). `BETTER_AUTH_SECRET` is also required for submission-limit identity hashing.

For unattended retries, set a strong `CRON_SECRET` in the hosting environment and schedule an authenticated `GET /api/jobs/email-outbox`, for example once per minute. Send `Authorization: Bearer <CRON_SECRET>` as a header; never put the secret in the URL. The endpoint rejects unauthenticated requests. Each invocation claims at most one due message, applies exponential backoff and stops after five attempts. An interrupted attempt can be reclaimed after its lease expires. The enquiry remains saved even if email cannot be delivered. Staff can retry from **Sales → Website enquiries**. Hosting credentials and a scheduler were not available in this checkout, so this external scheduling step remains to be configured at deployment.

SMTP delivery and a database commit cannot be made atomic. A process failure after the SMTP server accepts mail but before the database records `SENT` can cause a repeated notification on retry; the saved enquiry and generated quotation remain deduplicated.

## Validation

- 37 integrity/product-approval tests passed, including current-role revocation and shared payroll-preview checks.
- 17 Gmail/quotation tests passed, including authenticated PDF rendering and duplicate-send handling.
- Real PostgreSQL checks passed in disposable schemas: additive migration/backfill, concurrent stock/availability, one-winner autosave, recalculated invoice finalization, payroll carry-forward/closed periods, durable enquiry deduplication, failed-SMTP retry and single-claim successful delivery.
- Browser testing used a separate disposable schema with SMTP disabled. A discounted offline invoice finalized at ₹318.60; enquiry review created a quotation with the submitted details; public catalog/detail pages suppressed unverified zone/Ex markings. The production-build payroll preview correctly included ₹100 unpaid wages and ₹300 outstanding advances: ₹300 payable with advances applied, ₹600 when deferred.
- The focused UI source detector returned no findings. This is not a full accessibility audit.
- The final `pnpm build` passed compilation, TypeScript and page generation. Its Server Action manifest did not expose the removed generic sender, the replacement internal mail utility or the authentication helper.

Disposable schemas, preview credentials and generated preview build output were removed after verification. The migration remains applied. Source changes have not been deployed to the hosted application; rebuild with the hosting environment when releasing.

The repository-wide lint baseline still contains unrelated existing errors (the original audit counted 366 errors and 170 warnings). Focused lint is used for the new integrity modules; this change does not claim a clean repository-wide lint run.

## Re-running checks

Run `pnpm typecheck`, `pnpm test` and `pnpm build` from the repository root. CI runs TypeScript and the unit/integration mocks on Node 24.

For real database checks, set `TEST_DATABASE_URL` to an isolated test database and run `pnpm test:database`. The runner creates and drops only its own validated random schema. An explicit `ALLOW_ISOLATED_SCHEMA_TEST=1` also permits using the configured connection with a separate test schema. No business fixtures or mailboxes are used, and SMTP is mocked.
