# Sending quotation emails

See [Gmail dashboard setup](gmail-dashboard.md) for the existing inbox integration. Sending additionally requires `https://www.googleapis.com/auth/gmail.send` in the Google consent screen and reconnecting the mailbox.

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
