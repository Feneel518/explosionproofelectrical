import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/check/requireAuth";
import { createGmailOAuthState } from "@/lib/gmail/crypto";
import { gmailConfiguration, GMAIL_SCOPE, GMAIL_STATE_COOKIE } from "@/lib/gmail/google";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await requireAuth();
  try {
    const config = gmailConfiguration();
    const { state, challenge, cookie } = createGmailOAuthState(user.id);
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code",
      scope: GMAIL_SCOPE, access_type: "offline", prompt: "consent select_account",
      state, code_challenge: challenge, code_challenge_method: "S256",
    }).toString();
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(GMAIL_STATE_COOKIE, cookie, {
      httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax",
      path: "/api/gmail", maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Gmail setup is incomplete. See docs/gmail-dashboard.md." }, { status: 503 });
  }
}
