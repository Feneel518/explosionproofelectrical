import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test, after } from "node:test";
import { createGmailOAuthState, decryptGmailSecret, encryptGmailSecret, validateGmailOAuthState } from "../src/lib/gmail/crypto";
import { buildGmailSearch, exchangeGmailToken, GmailApiError } from "../src/lib/gmail/google";
import { getMatchingGmailMessages } from "../src/lib/gmail/messages";

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

test("sync follows pagination, deduplicates IDs, and only requests message metadata", async () => {
  const requested: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    requested.push(url.href);
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-access");
    if (url.pathname.endsWith("/messages")) {
      return Response.json(url.searchParams.has("pageToken") ? { messages: [{ id: "one" }, { id: "two" }] } : { messages: [{ id: "one" }], nextPageToken: "page2" });
    }
    assert.equal(url.searchParams.get("format"), "metadata");
    assert.deepEqual(url.searchParams.getAll("metadataHeaders"), ["Subject", "From"]);
    return Response.json({ id: url.pathname.split("/").pop(), threadId: "thread1", internalDate: "1794900000000", payload: { headers: [{ name: "sUbJeCt", value: "Purchase order" }, { name: "From", value: "Customer <buyer@example.com>" }] } });
  };
  const messages = await getMatchingGmailMessages("test-access", "in:inbox");
  assert.equal(messages.length, 2);
  assert.equal(messages[0].subject, "Purchase order");
  assert.equal(messages[0].sender, "Customer <buyer@example.com>");
  assert.equal(requested.length, 4);
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
