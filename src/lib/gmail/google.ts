export const GMAIL_READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
export const GMAIL_SCOPE = `${GMAIL_READ_SCOPE} ${GMAIL_SEND_SCOPE}`;

export function gmailCanSend(scope: string) {
  return scope.split(/\s+/).includes(GMAIL_SEND_SCOPE);
}
export const LEGACY_DEFAULT_GMAIL_QUERY = 'in:inbox -in:sent {subject:order subject:"purchase order" subject:inquiry subject:enquiry subject:RFQ subject:quotation subject:"quote request"}';
export const DEFAULT_GMAIL_QUERY = 'in:inbox -in:sent {subject:order subject:"purchase order" subject:"purchase doc" subject:"purchase document" subject:inquiry subject:enquiry subject:RFQ subject:quotation subject:"quote request"}';

export function upgradeDefaultGmailQuery(query: string) {
  return query === LEGACY_DEFAULT_GMAIL_QUERY ? DEFAULT_GMAIL_QUERY : query;
}
export const GMAIL_STATE_COOKIE = "gmail-oauth-state";

export function gmailConfiguration() {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const origin = process.env.BETTER_AUTH_URL;
  if (!clientId || !clientSecret || !origin || Buffer.from(process.env.GMAIL_TOKEN_ENCRYPTION_KEY ?? "", "base64").length !== 32) {
    throw new Error("Gmail is not configured. See docs/gmail-dashboard.md.");
  }
  const baseUrl = new URL(origin);
  if (baseUrl.protocol !== "https:" && !(baseUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(baseUrl.hostname))) {
    throw new Error("Gmail requires HTTPS, except on localhost.");
  }
  return { clientId, clientSecret, origin: baseUrl.origin, redirectUri: new URL("/api/gmail/callback", baseUrl.origin).href };
}

export function gmailIsConfigured() {
  try { gmailConfiguration(); return true; } catch { return false; }
}

export class GmailApiError extends Error {
  constructor(public status: number, public code: string) {
    super(isGmailRateLimitCode(status, code)
      ? "Gmail is temporarily busy. Please wait about a minute and try again."
      : status === 401 || code === "invalid_grant"
      ? "Gmail access expired. Reconnect your mailbox."
      : status === 403 ? "Gmail access was denied. Enable the Gmail API and reconnect with the requested permissions."
      : status === 429 ? "Gmail is busy. Please try again shortly."
      : "Gmail could not be reached. Please try again.");
  }
}

function isGmailRateLimitCode(status: number, code: string) {
  return status === 429 || ["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded"].includes(code);
}

export function isGmailRateLimit(error: unknown): error is GmailApiError {
  return error instanceof GmailApiError && isGmailRateLimitCode(error.status, error.code);
}

export async function exchangeGmailToken(params: Record<string, string>): Promise<{ access_token: string; refresh_token?: string; scope?: string }> {
  const { clientId, clientSecret } = gmailConfiguration();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new GmailApiError(response.status, data.error || "token_error");
  return data;
}

export async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    cache: "no-store", signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const reason = body?.error?.errors?.[0]?.reason;
    // Keep only known reason codes; upstream messages may contain private details.
    const code = ["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded", "dailyLimitExceeded", "authError", "insufficientPermissions", "domainPolicy"].includes(reason) ? reason : "api_error";
    throw new GmailApiError(response.status, code);
  }
  return response.json();
}

export function buildGmailSearch(query: string, lastSyncedAt: Date | null, now = new Date()) {
  // A user-supplied historical range must not be intersected with an invisible 30-day range.
  const unquoted = query.replace(/"(?:\\.|[^"\\])*"/g, "");
  if (!lastSyncedAt && /(?:^|[\s({])(?:after|before|newer|older|newer_than|older_than):\S+/i.test(unquoted)) return `(${query})`;
  // Overlap by two minutes to handle Gmail indexing delays; the unique key deduplicates results.
  const since = lastSyncedAt ? lastSyncedAt.getTime() - 120_000 : now.getTime() - 30 * 86_400_000;
  return `(${query}) after:${Math.floor(since / 1000)}`;
}
