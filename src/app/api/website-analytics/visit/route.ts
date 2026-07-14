import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma/db";
import {
  classifyVisitSource,
  detectBrowser,
  detectDeviceType,
  detectOS,
  extractHost,
  isBotUserAgent,
  normalizeNullableString,
} from "@/lib/helpers/server/websiteVisitorAnalytics";

const VISITOR_COOKIE = "wa_visitor";
const SESSION_COOKIE = "wa_session";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SESSION_MAX_AGE = 60 * 30; // 30 minutes
const SKIP_PREFIXES = [
  "/dashboard",
  "/superadmin",
  "/auth",
  "/api",
  "/invoices",
  "/quotations",
  "/sales-orders",
  "/delivery-challans",
  "/grn",
];

function shouldSkipPath(path: string) {
  return SKIP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function sanitizePath(path: string | null) {
  if (!path || !path.startsWith("/")) return null;
  return path.slice(0, 300);
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const path = sanitizePath(normalizeNullableString(body?.path));
    if (!path || shouldSkipPath(path)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const userAgent = normalizeNullableString(req.headers.get("user-agent"));
    if (isBotUserAgent(userAgent)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const queryString = normalizeNullableString(body?.query)?.slice(0, 800) ?? null;
    const pageTitle = normalizeNullableString(body?.title)?.slice(0, 255) ?? null;
    const referrer = normalizeNullableString(body?.referrer)?.slice(0, 1000) ?? null;
    const utmSource = normalizeNullableString(body?.utmSource)?.slice(0, 100) ?? null;
    const utmMedium = normalizeNullableString(body?.utmMedium)?.slice(0, 100) ?? null;
    const utmCampaign =
      normalizeNullableString(body?.utmCampaign)?.slice(0, 120) ?? null;

    const sourceHost = extractHost(referrer);
    const siteHost = normalizeNullableString(req.headers.get("host"));
    const sourceType = classifyVisitSource({
      utmSource,
      utmMedium,
      sourceHost,
      siteHost,
    });

    const existingVisitorId = req.cookies.get(VISITOR_COOKIE)?.value || null;
    const existingSessionId = req.cookies.get(SESSION_COOKIE)?.value || null;
    const visitorId = existingVisitorId || randomUUID();
    const sessionId = existingSessionId || randomUUID();
    const isSessionEntry = !existingSessionId;

    await prisma.websiteVisit.create({
      data: {
        visitorId,
        sessionId,
        isFrontend: true,
        isSessionEntry,
        path,
        queryString,
        pageTitle,
        referrer,
        sourceHost,
        sourceType,
        utmSource,
        utmMedium,
        utmCampaign,
        country:
          normalizeNullableString(req.headers.get("x-vercel-ip-country")) ||
          normalizeNullableString(req.headers.get("cf-ipcountry")) ||
          null,
        countryRegion:
          normalizeNullableString(req.headers.get("x-vercel-ip-country-region")) ||
          null,
        city: normalizeNullableString(req.headers.get("x-vercel-ip-city")) || null,
        deviceType: detectDeviceType(userAgent),
        browser: detectBrowser(userAgent),
        os: detectOS(userAgent),
        userAgent,
        ipHash: hashIp(getClientIp(req)),
      },
    });

    const response = NextResponse.json({ ok: true });

    if (!existingVisitorId) {
      response.cookies.set({
        name: VISITOR_COOKIE,
        value: visitorId,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: VISITOR_MAX_AGE,
      });
    }

    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionId,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("website analytics visit tracking failed", error);
    return NextResponse.json({ ok: true, skipped: true });
  }
}
