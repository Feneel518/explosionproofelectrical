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

## Replying to the original conversation

The Send Quotation dialog lists conversations already linked to the quotation, plus recent imported messages from the quotation/customer email address in the signed-in user's mailbox. One linked conversation (or one matching conversation) is selected automatically; when several match, choose the intended conversation. Link older/unlisted customer messages from Gmail Sales Inbox if needed. “Send a new email” remains available explicitly.

Reply mode loads the original Gmail message's current metadata and keeps its subject and Reply-To (falling back to From). Both are read-only while replying. The server checks the notification belongs to the signed-in user and is linked to the quotation or matches its customer address; it fetches Gmail headers itself rather than trusting client-provided thread IDs or reply headers. Gmail receives threadId, In-Reply-To and References with the PDF MIME attachment. This sends to the original reply address, not Reply All.

The default editable message thanks the customer, references the quotation, and includes Explosion Proof Electrical Control, Ashok Patel & Ajit Patel, the Vapi address, both telephone numbers and the website. The HTML version formats the signature and makes the known telephone/website links clickable. All edited message text is escaped. A sandboxed message preview is available before sending.

## Follow-up and order tracking in the conversation

The user reviews and creates orders; incoming email never accepts or finalizes an order automatically. Open the original conversation to see linked quotations and orders. Each active quotation shows its next follow-up and a Schedule follow-up action. Review & create order carries the quotation's products/prices into an editable draft. Repeated conversion clicks reopen an existing draft. Follow-up reminders remain active until the order is finalized, when the existing quotation conversion marks it Won.

New quotation emails and replies save their Gmail conversation link after a confirmed send. Linking a quotation also links its existing orders; linking an order also links its source quotation. Conversion/finalization inherits the mailbox owner's conversation links. New messages on the same thread therefore show the same quotation/order history. Order cards show status, PO, dispatched quantity and pending quantity. Quotation and order detail pages both provide links back to the original conversation. Other mailbox owners' private links are never copied.

When one active finalized quotation is already linked, Create order draft from the inbox uses that quotation; reviewed PDF imports also carry that quotation relationship into the order. Multiple linked quotations are not guessed: choose Review & create order on the intended quotation card.

Verification: `node --import tsx --test scripts/gmail-integration.test.ts scripts/quotation-email.test.ts scripts/gmail-pdf-import.test.ts`; `node --import tsx -r dotenv/config scripts/gmail-sales.integration.ts` verifies bidirectional links, inherited conversations, future replies and follow-up retention inside a transaction which is always rolled back.

## Ready versus Sent status

Finalizing/saving the customer copy now sets READY. The quotation remains viewable, printable and eligible for email or order review. Only a confirmed Gmail receipt changes the unchanged READY version to SENT, in the same transaction as its delivery receipt. Failed/unknown sends keep READY. Newer edits, deleted records and later sales statuses are not overwritten by a delayed receipt or resend. The detail page refreshes after a successful send.

READY is included in the quotation status filter and pending sales pipeline but excluded from Sent totals. Reopening or unlinking an order preserves a Ready/Draft quotation and does not invent a Sent status without a confirmed delivery record. Existing historical statuses are not relabelled by the additive enum migration.

Migration: 20261118090000_quotation_ready_status. The rolled-back sales integration test checks rejected, unknown and successful deliveries, receipt validation, newer edits and resending Won quotations.
