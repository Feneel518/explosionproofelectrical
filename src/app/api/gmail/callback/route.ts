import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/check/requireAuth";
import { encryptGmailSecret, validateGmailOAuthState } from "@/lib/gmail/crypto";
import { DEFAULT_GMAIL_QUERY, exchangeGmailToken, gmailConfiguration, gmailGet, GMAIL_SCOPE, GMAIL_STATE_COOKIE } from "@/lib/gmail/google";
import { prisma } from "@/lib/prisma/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user } = await requireAuth();
  const config = gmailConfiguration();
  const destination = new URL("/dashboard/inbox", config.origin);
  try {
    const state = request.nextUrl.searchParams.get("state");
    const cookie = request.cookies.get(GMAIL_STATE_COOKIE)?.value;
    if (!state || !cookie) throw new Error("Missing OAuth state");
    const verifier = validateGmailOAuthState(cookie, state, user.id);
    const code = request.nextUrl.searchParams.get("code");
    if (request.nextUrl.searchParams.has("error") || !code) throw new Error("Authorization declined");
    const tokens = await exchangeGmailToken({ grant_type: "authorization_code", code, redirect_uri: config.redirectUri, code_verifier: verifier });
    if (!tokens.refresh_token || !GMAIL_SCOPE.split(" ").every((scope) => tokens.scope?.split(" ").includes(scope))) throw new Error("Gmail read and send access was not granted");
    const profile = await gmailGet<{ emailAddress: string }>(tokens.access_token, "profile");
    await prisma.$transaction(async (tx) => {
      const existing = await tx.gmailConnection.findUnique({ where: { userId: user.id } });
      if (existing?.email.toLowerCase() === profile.emailAddress.toLowerCase()) {
        await tx.gmailConnection.update({ where: { userId: user.id }, data: {
          encryptedRefreshToken: encryptGmailSecret(tokens.refresh_token!), grantedScopes: tokens.scope!, connectedAt: new Date(), syncLeaseUntil: null,
        } });
        return;
      }
      // Switching mailboxes clears the previous mailbox's private alerts atomically.
      await tx.gmailConnection.deleteMany({ where: { userId: user.id } });
      await tx.gmailConnection.create({ data: {
        userId: user.id, email: profile.emailAddress,
        encryptedRefreshToken: encryptGmailSecret(tokens.refresh_token!), grantedScopes: tokens.scope!, searchQuery: DEFAULT_GMAIL_QUERY,
      } });
    });
    destination.searchParams.set("gmail", "connected");
  } catch {
    // Never echo Google responses or tokens to the browser or logs.
    destination.searchParams.set("gmail", "failed");
  }
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(GMAIL_STATE_COOKIE, "", { path: "/api/gmail", maxAge: 0 });
  return response;
}
