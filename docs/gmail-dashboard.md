# Gmail dashboard notifications

The dashboard can connect one Gmail mailbox per authorized dashboard user. Alerts are private to that user. The Sales → Gmail Inbox Alerts page and header bell show matching incoming email subjects, senders and timestamps. These are email alerts, not automatically accepted sales orders or quotations.

## Server setup

1. Enable the **Gmail API** in the Google Cloud project for the OAuth client. The existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are used by default. Alternatively set dedicated `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` values.
2. In the Google Auth Platform / OAuth consent screen, allow `https://www.googleapis.com/auth/gmail.readonly`. If the app is in Testing, add the receiving Gmail account as a test user. External apps using this restricted scope may require Google verification for production. Testing refresh tokens normally expire after seven days for Gmail scopes.
3. Add the exact authorized redirect URI to the **Web application** OAuth client:
   - Production: `https://www.explosionproofelectrical.com/api/gmail/callback`
   - Local development: `http://localhost:3000/api/gmail/callback`
   - If using another hostname, register `<BETTER_AUTH_URL origin>/api/gmail/callback` instead. The initiating dashboard and callback must use the same origin.
4. Set `BETTER_AUTH_URL` to the actual site origin. Set `GMAIL_TOKEN_ENCRYPTION_KEY` to a base64-encoded 32-byte random key. Generate it using a password manager or a cryptographically secure generator. Keep it stable and secret, back it up, and use separate keys per environment. Changing it requires reconnecting Gmail. Never use a `NEXT_PUBLIC_` variable for credentials.
5. Apply the additive database migration with `pnpm exec prisma migrate deploy`, then regenerate/build with `pnpm build`. Existing migrations must be reviewed before deploying; do not reset the database.
6. Sign in to an allowed dashboard account, open `/dashboard/inbox`, click **Connect Gmail**, select the mailbox that receives orders/inquiries, and allow read access.

The Codex Gmail connector does not grant this independently hosted website OAuth credentials. The mailbox owner must complete the site's Google consent flow.

## Behavior

- The default Gmail query matches inbox emails with order, purchase order, inquiry, enquiry, RFQ, quotation or quote request in the subject. Edit the query on the inbox page to match the business's actual subjects or labels. For example, `in:inbox label:Sales` or `in:inbox {subject:order subject:enquiry}`. This is keyword/search filtering, not automatic intent classification.
- The first sync checks the last 30 days. Later syncs use the last successful checkpoint with a two-minute overlap and deduplicate by Gmail message ID. Pagination is followed up to 1,000 matches; exceeding this shows an error and preserves the checkpoint. Narrow the filter to continue.
- The dashboard checks once a minute while open and visible and when focus returns. The next visit catches up since the last sync. This implementation does not run a background scheduler, push browser notifications while closed, or send notifications by email.
- The initial sync populates the bell and inbox. New matches found during subsequent checks also show a toast. The inbox displays the latest 100 matching emails and the total unread alert count.
- Only Subject and From headers and message timestamps/IDs are stored. Bodies and attachments are not fetched. Google's read-only scope is required because Gmail does not allow search queries with the narrower metadata scope. Gmail content is rendered as plain text.
- Local read state does not change Gmail labels or read status. Open the original message using **Open in Gmail**.
- Disconnect immediately deletes the local encrypted refresh token and alerts. It does not revoke the Google grant, because this may share a client with site sign-in. The account owner can also remove the site's access in Google Account → Security → Third-party connections.
- Revoked/expired credentials and permission failures display a reconnect message. Sync failures retain existing alerts and do not advance the checkpoint. Gmail is never used to send, modify, or delete messages.
- Tokens are encrypted with AES-256-GCM at rest. OAuth uses short-lived encrypted state bound to the signed-in user, an HttpOnly SameSite cookie, and PKCE. All server actions and OAuth routes enforce the existing dashboard allowlist, and all data queries are scoped to the signed-in user's ID.

## Validation

Run `node --import tsx --test scripts/gmail-integration.test.ts` and `pnpm exec tsc --noEmit`. The automated tests cover token encryption/tamper rejection, user-bound OAuth state and expiry, search windows, paginated deduplication, metadata-only fetches, partial-sync failures, and revoked token handling.

For live verification after Google setup, connect the actual mailbox, receive a matching customer email, wait up to a minute with the dashboard visible, verify one new bell alert/toast, open it in Gmail, and mark it read locally. Repeated refreshes must not duplicate it. Confirm disconnect removes stored alerts and stops syncing. The integration does not send a test email automatically.

References: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Gmail message search](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list), [Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).
