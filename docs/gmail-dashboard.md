# Gmail dashboard notifications and quotation emails

Current implementation status: mailbox notifications, quotation sending, conversation-link helpers and attention queries are present. Gmail-to-sales draft creation and PDF-to-order import are not implemented in this checkout. References below to those review/import controls describe intended workflows. The database integration check now tests the implemented conversation and delivery behavior and requires an isolated `TEST_DATABASE_URL`.

The dashboard can connect one Gmail mailbox per authorized dashboard user. Alerts are private to that user. The Sales → Gmail Inbox Alerts page and header bell show matching incoming email subjects, senders and timestamps. These are email alerts, not automatically accepted sales orders or quotations.

## Server setup

1. Enable the **Gmail API** in the Google Cloud project for the OAuth client. The existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are used by default. Alternatively set dedicated `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` values.
2. In the Google Auth Platform / OAuth consent screen, allow **both** `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`. If the app is in Testing, add the Gmail account as a test user. External apps using restricted scopes may require Google verification for production. Testing refresh tokens normally expire after seven days for Gmail scopes.
3. Add the exact authorized redirect URI to the **Web application** OAuth client:
   - Production: `https://www.explosionproofelectrical.com/api/gmail/callback`
   - Local development: `http://localhost:3000/api/gmail/callback`
   - If using another hostname, register `<BETTER_AUTH_URL origin>/api/gmail/callback` instead. The initiating dashboard and callback must use the same origin.
4. Set `BETTER_AUTH_URL` to the actual site origin. Set `GMAIL_TOKEN_ENCRYPTION_KEY` to a base64-encoded 32-byte random key. Generate it using a password manager or a cryptographically secure generator. Keep it stable and secret, back it up, and use separate keys per environment. Changing it requires reconnecting Gmail. Never use a `NEXT_PUBLIC_` variable for credentials.
5. Apply the additive database migration with `pnpm exec prisma migrate deploy`, then regenerate/build with `pnpm build`. Existing migrations must be reviewed before deploying; do not reset the database.
6. Sign in to an allowed dashboard account, open `/dashboard/inbox`, click **Connect Gmail**, select the mailbox that receives orders/inquiries, and allow read and send access. Existing read-only connections must use **Reconnect Gmail** once and allow both permissions. Reconnecting the same mailbox preserves inbox alerts and the search filter.

The Codex Gmail connector does not grant this independently hosted website OAuth credentials. The mailbox owner must complete the site's Google consent flow.

## Behavior

- The default Gmail query matches inbox emails with order, purchase order, inquiry, enquiry, RFQ, quotation or quote request in the subject. Edit the query on the inbox page to match the business's actual subjects or labels. For example, `in:inbox label:Sales` or `in:inbox {subject:order subject:enquiry}`. This is keyword/search filtering, not automatic intent classification.
- The first sync checks the last 30 days. Later syncs use the last successful checkpoint with a two-minute overlap and deduplicate by Gmail message ID. Pagination is followed up to 1,000 matches; exceeding this shows an error and preserves the checkpoint. Narrow the filter to continue.
- The dashboard checks once a minute while open and visible and when focus returns. The next visit catches up since the last sync. This implementation does not run a background scheduler, push browser notifications while closed, or send notifications by email.
- The initial sync populates the bell and inbox. New matches found during subsequent checks also show a toast. The inbox displays the latest 100 matching emails and the total unread alert count.
- Only Subject and From headers and message timestamps/IDs are stored. Bodies and attachments are not fetched. Google's read-only scope is required because Gmail does not allow search queries with the narrower metadata scope. Gmail content is rendered as plain text.
- Local read state does not change Gmail labels or read status. Open the original message using **Open in Gmail**.
- Disconnect immediately deletes the local encrypted refresh token and alerts. It does not revoke the Google grant, because this may share a client with site sign-in. The account owner can also remove the site's access in Google Account → Security → Third-party connections.
- Revoked/expired credentials and permission failures display a reconnect message. Sync failures retain existing alerts and do not advance the checkpoint. Sending happens only when a dashboard user submits a quotation email. Gmail messages and labels are not modified or deleted.
- Tokens are encrypted with AES-256-GCM at rest. OAuth uses short-lived encrypted state bound to the signed-in user, an HttpOnly SameSite cookie, and PKCE. All server actions and OAuth routes enforce the existing dashboard allowlist, and all data queries are scoped to the signed-in user's ID.

## Validation

Run `node --import tsx --test scripts/gmail-integration.test.ts scripts/quotation-email.test.ts` and `pnpm exec tsc --noEmit`. The automated tests cover token encryption/tamper rejection, user-bound OAuth state and expiry, search windows, paginated deduplication, metadata-only fetches, partial-sync failures, revoked token handling, email validation, PDF attachment integrity, send permissions, duplicate requests, ambiguous send results, and authenticated customer-copy rendering (including stale-copy rejection and blocked mutations). The browser integration test writes its PDF to ignored `tmp/pdfs/`. The actual customer-copy template was also visually checked with one-item and six-item sample quotations.

For live verification after Google setup, connect the actual mailbox, receive a matching customer email, wait up to a minute with the dashboard visible, verify one new bell alert/toast, open it in Gmail, and mark it read locally. Repeated refreshes must not duplicate it. Confirm disconnect removes stored alerts and stops syncing. The integration does not send a test email automatically.

## PDF runtime

`playwright-core` drives Chromium. The bundled Linux browser requires Node.js 22.17+ (or Node.js 24+). Linux deployments use the bundled `@sparticuz/chromium` binary (included in Next output tracing). Windows development uses installed Microsoft Edge or Google Chrome; macOS uses Chrome. Set `PDF_CHROMIUM_EXECUTABLE_PATH` to use a specific browser executable. The server must be able to reach its own `BETTER_AUTH_URL`; the customer-copy request authenticates with the current user's session cookies. Ensure deployment protection/networking permits that request. PDF preview and quotation actions allow up to 120 seconds.

## Sending quotation PDFs

1. Apply migrations, including `20261117110000_quotation_gmail_sending`, and regenerate Prisma Client before starting the updated app. This migration adds granted scope tracking and quotation email receipts; it does not change existing quotations. Existing connections default to read-only until reconnected.
2. Add the send scope in Google Cloud and reconnect the mailbox as described above.
3. Open a finalized quotation under **Sales → Quotations → View**, then click **Send Quotation**. Draft, cancelled and deleted quotations cannot be emailed.
4. The sender is the signed-in dashboard user's connected Gmail mailbox. The recipient defaults to the enquiry's received email, then the customer's company email. Review or edit the recipient, subject and message.
5. Use **Preview / download PDF** to inspect the attachment. The server opens the existing authenticated `/quotations/[id]/view` customer-copy page in headless Chromium and prints that page to PDF. Its existing layout, logos, fonts, item details, images, drawing links and terms are the PDF source. The email attachment and PDF preview use this same process; there is no separate quotation template.
6. Click **Send with PDF**. The server rechecks authorization, connection permissions and quotation version; generates the PDF itself; and calls Gmail `messages.send`. It does not accept uploaded/browser-supplied PDF bytes or arbitrary From addresses. A changed quotation must be refreshed and reviewed again.

Only one recipient is supported per send. PDF attachments are limited to 18 MiB. The browser waits for fonts, images, hydration and pagination before printing. A missing image or changed quotation prevents sending an incomplete or stale PDF. Drawing PDFs retain the links in the customer copy. Session cookies are restricted to the configured app origin; external scripts and non-GET requests are blocked during rendering.

Each send attempt has a unique request key stored in `quotation_email_deliveries`, with sender, recipient, subject, status and Gmail message ID/sent time when confirmed. Replaying that key never sends again. Google failures, revoked access and rate limits show safe messages. A timeout or ambiguous response instructs the user to check **Gmail Sent** before opening a fresh send attempt; the app never automatically retries a send. A local receipt write failure after Gmail accepts the message is reported as sent, with a warning to check Gmail Sent. No email bodies, PDF bytes or access tokens are stored in the delivery table. Local receipts remain after Gmail disconnects.

For a live send check, use a quotation and recipient you intend to email, preview the attachment, submit the email, and confirm that Gmail Sent and the recipient show the same PDF. Automated checks mock Gmail and send no real email.

References: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Gmail message search](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list), [Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [sending MIME messages](https://developers.google.com/workspace/gmail/api/guides/sending), [messages.send](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send).
