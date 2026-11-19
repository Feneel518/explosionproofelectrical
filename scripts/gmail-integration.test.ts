import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test, after } from "node:test";
import { createGmailOAuthState, decryptGmailSecret, encryptGmailSecret, validateGmailOAuthState } from "../src/lib/gmail/crypto";
import { buildGmailSearch, exchangeGmailToken, gmailGet, GmailApiError } from "../src/lib/gmail/google";
import { getMatchingGmailMessages } from "../src/lib/gmail/messages";
import { emailDocument, parseGmailMessage, senderIdentity } from "../src/lib/gmail/mime";
import { getGmailConversationContent } from "../src/lib/gmail/conversation";
import type { GmailNotification } from "@prisma/client";

const originalFetch = globalThis.fetch;
process.env.GMAIL_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.GMAIL_CLIENT_ID = "test-client";
process.env.GMAIL_CLIENT_SECRET = "test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
after(() => { globalThis.fetch = originalFetch; });

test("stored tokens round trip, use randomized encryption, and reject tampering", () => {
  const first = encryptGmailSecret("refresh-token");
  assert.equal(decryptGmailSecret(first), "refresh-token");
  assert.notEqual(first, encryptGmailSecret("refresh-token"));
  assert.ok(!first.includes("refresh-token"));
  const bytes = Buffer.from(first, "base64url");
  bytes[bytes.length - 1] ^= 1;
  assert.throws(() => decryptGmailSecret(bytes.toString("base64url")));
});

test("OAuth state binds authorization to the state, user, and expiry", () => {
  const state = createGmailOAuthState("owner");
  assert.ok(validateGmailOAuthState(state.cookie, state.state, "owner"));
  assert.throws(() => validateGmailOAuthState(state.cookie, "wrong-state", "owner"));
  assert.throws(() => validateGmailOAuthState(state.cookie, state.state, "another-user"));
  const expired = encryptGmailSecret(JSON.stringify({ userId: "owner", state: state.state, verifier: "test", expiresAt: Date.now() - 1 }));
  assert.throws(() => validateGmailOAuthState(expired, state.state, "owner"));
});

test("search covers initial history and overlaps incremental syncs", () => {
  const now = new Date("2026-11-17T10:00:00Z");
  const initial = buildGmailSearch("subject:order OR subject:inquiry", null, now);
  assert.equal(initial, `(subject:order OR subject:inquiry) after:${Math.floor(now.getTime() / 1000) - 30 * 86400}`);
  assert.equal(buildGmailSearch("in:inbox", now), `(in:inbox) after:${Math.floor(now.getTime() / 1000) - 120}`);
});

test("sync follows pagination, deduplicates IDs, and indexes full text for search", async () => {
  const requested: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    requested.push(url.href);
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-access");
    if (url.pathname.endsWith("/messages")) {
      return Response.json(url.searchParams.has("pageToken") ? { messages: [{ id: "one" }, { id: "two" }] } : { messages: [{ id: "one" }], nextPageToken: "page2" });
    }
    assert.equal(url.searchParams.get("format"), "full");
    return Response.json({ id: url.pathname.split("/").pop(), threadId: "thread1", internalDate: "1794900000000", payload: { mimeType: "text/plain", body: { data: Buffer.from("Please quote ten flameproof switches.").toString("base64url") }, headers: [{ name: "sUbJeCt", value: "Purchase order" }, { name: "From", value: "Customer <buyer@example.com>" }] } });
  };
  const { messages, complete } = await getMatchingGmailMessages("test-access", "in:inbox");
  assert.equal(complete, true);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].subject, "Purchase order");
  assert.equal(messages[0].sender, "Customer <buyer@example.com>");
  assert.equal(messages[0].bodyText, "Please quote ten flameproof switches.");
  assert.ok(messages[0].contentIndexedAt instanceof Date);
  assert.equal(requested.length, 4);
});

test("nested MIME keeps plain and safe formatted content separate from files", () => {
  const parsed = parseGmailMessage({ id: "abc", threadId: "thread", internalDate: "1794900000000", payload: { mimeType: "multipart/mixed", parts: [
    { mimeType: "multipart/alternative", parts: [
      { partId: "0.0", mimeType: "text/plain", body: { data: Buffer.from("Need 10 switches").toString("base64url") } },
      { partId: "0.1", mimeType: "text/html", body: { data: Buffer.from('<p>Need <b>10</b> switches</p><script>alert(1)</script><img src="https://tracker.test/pixel"><a href="javascript:alert(1)">bad</a><a href="https://example.com">link</a>').toString("base64url") } },
    ] },
    { partId: "1", mimeType: "application/pdf", filename: "PO.pdf", body: { attachmentId: "file-id", size: 1500 } },
    { partId: "2", mimeType: "text/plain", filename: "spec.txt", body: { data: Buffer.from("File content").toString("base64url"), size: 12 } },
  ] } });
  assert.equal(parsed.bodyText, "Need 10 switches");
  assert.equal(parsed.hasAttachments, true);
  assert.deepEqual(parsed.attachments.map(file => [file.partId, file.filename, file.previewable]), [["1", "PO.pdf", true], ["2", "spec.txt", true]]);
  assert.ok(!/script|tracker|javascript:|<img/i.test(parsed.bodyHtml));
  assert.match(parsed.bodyHtml, /<b>10<\/b>/);
  assert.match(parsed.bodyHtml, /noopener noreferrer/);
  assert.match(emailDocument(parsed.bodyHtml), /default-src 'none'/);
});

test("HTML-only messages decode entities and declared character sets for readable search", () => {
  const parsed = parseGmailMessage({ id: "one", threadId: "thread", internalDate: "1794900000000", payload: {
    mimeType: "text/html", headers: [{ name: "Content-Type", value: "text/html; charset=windows-1252" }],
    body: { data: Buffer.from('<p>Caf\xe9 &amp; valves</p><p>Qty &#x31;&#48;</p>', "latin1").toString("base64url") },
  } });
  assert.equal(parsed.bodyText, "Café & valves\nQty 10");
  assert.deepEqual(senderIdentity('"A Buyer" <BUYER@example.com>'), { email: "buyer@example.com", name: "A Buyer" });
});

test("failed pages fail the sync instead of returning a partial successful import", async () => {
  globalThis.fetch = async (input) => new URL(String(input)).searchParams.has("pageToken")
    ? Response.json({ error: "rate limited" }, { status: 429 })
    : Response.json({ messages: [{ id: "one" }], nextPageToken: "page2" });
  await assert.rejects(getMatchingGmailMessages("test-access", "in:inbox"), (error: unknown) => error instanceof GmailApiError && error.status === 429);
});

test("revoked refresh tokens produce a safe reconnect message", async () => {
  globalThis.fetch = async () => Response.json({ error: "invalid_grant", error_description: "sensitive upstream response" }, { status: 400 });
  await assert.rejects(exchangeGmailToken({ grant_type: "refresh_token", refresh_token: "test-refresh" }), (error: unknown) => error instanceof GmailApiError && /Reconnect/.test(error.message) && !error.message.includes("sensitive"));
});

test("Google 403 rate limits are distinguished from missing Gmail permission", async () => {
  globalThis.fetch = async () => Response.json({ error: { errors: [{ reason: "rateLimitExceeded" }], message: "Private quota details" } }, { status: 403, headers: { "Retry-After": "60" } });
  await assert.rejects(gmailGet("access", "threads/thread?format=full"), (error: unknown) => error instanceof GmailApiError && error.code === "rateLimitExceeded" && /minute|busy|limit/i.test(error.message) && !/reconnect|enable/i.test(error.message) && !error.message.includes("Private"));
});

test("a quota-limited reader opens saved content without claiming Gmail access expired", async () => {
  globalThis.fetch = async () => Response.json({ error: { errors: [{ reason: "rateLimitExceeded" }] } }, { status: 403 });
  const notification: GmailNotification = { id: "notice", userId: "owner", messageId: "message", threadId: "thread", subject: "Order", sender: "Buyer", receivedAt: new Date(), createdAt: new Date(), readAt: null, snippet: "Saved request", bodyText: "Please supply ten switches", hasAttachments: true, contentIndexedAt: new Date(), starred: false, status: "NEW", internalNote: null };
  const content = await getGmailConversationContent("access", notification);
  assert.equal(content.messages[0].bodyText, notification.bodyText);
  assert.match(content.warning!, /saved message/);
  assert.ok(!/expired|reconnect/i.test(content.warning!));
  globalThis.fetch = async () => Response.json({ error: { errors: [{ reason: "insufficientPermissions" }] } }, { status: 403 });
  await assert.rejects(getGmailConversationContent("access", notification), (error: unknown) => error instanceof GmailApiError && error.code === "insufficientPermissions");
});

test("sync skips already imported bodies and limits batches without completing an unfinished search", async () => {
  const bodyRequests: string[] = [];
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/messages")) return Response.json({ messages: ["known", "one", "two", "three"].map(id => ({ id })) });
    const id = url.pathname.split("/").pop()!;
    bodyRequests.push(id);
    return Response.json({ id, threadId: id, internalDate: "1794900000000", payload: { mimeType: "text/plain", body: { data: Buffer.from("Order").toString("base64url") } } });
  };
  const batch = await getMatchingGmailMessages("access", "in:inbox", { unknownIds: async ids => ids.filter(id => id !== "known"), limit: 2 });
  assert.equal(batch.complete, false);
  assert.deepEqual(bodyRequests, ["one", "two"]);
  bodyRequests.length = 0;
  const finished = await getMatchingGmailMessages("access", "in:inbox", { unknownIds: async () => [], limit: 2 });
  assert.equal(finished.complete, true);
  assert.equal(bodyRequests.length, 0);
});
