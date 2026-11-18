"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getGmailInboxAction, type GmailInboxData } from "@/lib/actions/dashboard/gmail/inboxActions";

const GmailContext = createContext<{
  data: GmailInboxData | null; loading: boolean; error: string | null; refresh: () => Promise<void>;
} | null>(null);

export function GmailNotificationsProvider({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  const [data, setData] = useState<GmailInboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const refreshQueued = useRef(false);
  const seen = useRef<Set<string> | null>(null);
  const mounted = useRef(false);
  const refresh = useCallback(async function refreshInbox() {
    if (!enabled) return;
    if (busy.current) { refreshQueued.current = true; return; }
    busy.current = true;
    try {
      const next = await getGmailInboxAction();
      if (!mounted.current) return;
      const newMessages = seen.current ? next.notifications.filter((item) => !item.read && !seen.current!.has(item.id)) : [];
      seen.current = new Set(next.notifications.map((item) => item.id));
      setData(next);
      setError(next.syncError);
      if (newMessages.length) toast.info(`${newMessages.length} new Gmail order or inquiry alert${newMessages.length === 1 ? "" : "s"}`, {
        id: "gmail-new-messages", description: newMessages[0].subject,
        action: { label: "View inbox", onClick: () => { window.location.href = "/dashboard/inbox"; } },
      });
    } catch {
      if (mounted.current) setError("Gmail notifications are temporarily unavailable. Please try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
      if (refreshQueued.current && mounted.current) {
        refreshQueued.current = false;
        await refreshInbox();
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    const loadWhenVisible = () => { if (!document.hidden) void refresh(); };
    loadWhenVisible();
    const interval = window.setInterval(loadWhenVisible, 60_000);
    window.addEventListener("focus", loadWhenVisible);
    document.addEventListener("visibilitychange", loadWhenVisible);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadWhenVisible);
      document.removeEventListener("visibilitychange", loadWhenVisible);
    };
  }, [refresh, enabled]);

  return <GmailContext.Provider value={{ data, loading, error, refresh }}>{children}</GmailContext.Provider>;
}

export function useGmailNotifications() {
  const context = useContext(GmailContext);
  if (!context) throw new Error("GmailNotificationsProvider is required");
  return context;
}
