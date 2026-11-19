import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutePrefixes = ["/dashboard", "/superadmin"];
const vercelHostname = "explosionproofelectrical.vercel.app";
const canonicalHostname = "www.explosionproofelectrical.com";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  if (nextUrl.hostname === vercelHostname) {
    const canonicalUrl = nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.hostname = canonicalHostname;

    return NextResponse.redirect(canonicalUrl, 308);
  }

  const sessionCookie = getSessionCookie(req);

  const res = NextResponse.next();
  const privatePrefixes = [...protectedRoutePrefixes, "/auth", "/serial", "/quotations", "/invoices", "/sales-orders", "/delivery-challans", "/purchase-orders", "/grn", "/design-preview"];
  const privatePage = privatePrefixes.some(prefix => nextUrl.pathname === prefix || nextUrl.pathname.startsWith(`${prefix}/`));
  const filteredCatalog = nextUrl.pathname === "/catalog" && ["cat", "q", "sort"].some(key => nextUrl.searchParams.has(key));
  if (privatePage || filteredCatalog) res.headers.set("X-Robots-Tag", "noindex, follow");

  const isLoggedIn = !!sessionCookie;

  const isOnProtectedRoute = protectedRoutePrefixes.some(
    (prefix) =>
      nextUrl.pathname === prefix || nextUrl.pathname.startsWith(`${prefix}/`),
  );

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
