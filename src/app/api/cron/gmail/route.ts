import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma/db";
import { syncGmail } from "@/lib/gmail/sync";
import { isDashboardEmailAllowed } from "@/lib/check/dashboardAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return new Response("Unauthorized", { status: 401 });
  const connections = await prisma.gmailConnection.findMany({ select: { userId: true, user: { select: { email: true } } } });
  let synced = 0; let failed = 0;
  for (const connection of connections) {
    if (!isDashboardEmailAllowed(connection.user.email)) continue;
    try { await syncGmail(connection.userId); synced++; } catch { failed++; }
  }
  return Response.json({ synced, failed }, { status: failed ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
