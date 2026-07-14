"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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

function shouldTrack(pathname: string) {
  return !SKIP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function FrontendVisitTracker() {
  const pathname = usePathname();
  const lastSentKeyRef = useRef<string>("");

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return;
    if (typeof window === "undefined") return;

    const search = window.location.search.replace(/^\?/, "");
    const queryParams = new URLSearchParams(search);
    const dedupeKey = `${pathname}?${search}`;
    if (lastSentKeyRef.current === dedupeKey) return;
    lastSentKeyRef.current = dedupeKey;

    // Deduplicate strict-mode double effects and accidental fast repeats.
    const sessionKey = `wa:last:${dedupeKey}`;
    const previousAt = Number(window.sessionStorage.getItem(sessionKey) || 0);
    const now = Date.now();
    if (now - previousAt < 8000) return;
    window.sessionStorage.setItem(sessionKey, String(now));

    const payload = {
      path: pathname,
      query: search || null,
      title: document.title || null,
      referrer: document.referrer || null,
      utmSource: queryParams.get("utm_source"),
      utmMedium: queryParams.get("utm_medium"),
      utmCampaign: queryParams.get("utm_campaign"),
    };

    const serialized = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([serialized], { type: "application/json" });
        navigator.sendBeacon("/api/website-analytics/visit", blob);
        return;
      }
    } catch {
      // no-op, fallback fetch below.
    }

    void fetch("/api/website-analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: serialized,
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
