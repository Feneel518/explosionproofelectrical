"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { disconnectGmailAction, markAllGmailNotificationsReadAction, updateGmailFilterAction } from "@/lib/actions/dashboard/gmail/inboxActions";
import { useGmailNotifications } from "./GmailNotificationsProvider";

export function GmailInboxSettings() {
  const { data, refresh, loading } = useGmailNotifications();
  const [query, setQuery] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<void>, message: string) => startTransition(async () => {
    try { await work(); await refresh(); toast.success(message); } catch { toast.error("Could not save mailbox settings. Please try again."); }
  });
  return <details className="rounded-lg border px-4 py-3" open={!loading && !data?.connection ? true : undefined}>
    <summary className="cursor-pointer text-sm font-medium"><Settings2 className="mr-2 inline size-4" aria-hidden="true" />Mailbox settings</summary>
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{data?.connection ? `${data.connection.email} · ${data.connection.lastSyncedAt ? `Last checked ${new Date(data.connection.lastSyncedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : "Waiting for the first sync"}` : "Connect the account that receives your customer emails."}</p>
      {data?.connection && <>
        {!data.connection.canSend && <p role="status" className="text-sm text-muted-foreground">Reconnect Gmail and allow sending to email quotations with their customer-copy PDF attached.</p>}
        <p className="text-sm text-muted-foreground">{data.backgroundEnabled ? "Mail is fetched every five minutes in the background, and every minute while the dashboard is visible." : "Mail is fetched every minute while this dashboard is visible. Background fetching still needs activation."}</p>
        <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); run(() => updateGmailFilterAction(query ?? data.connection!.searchQuery), "Mail import filter saved."); }}>
          <Field><FieldLabel htmlFor="gmail-import-query">Which emails should be imported?</FieldLabel><Input id="gmail-import-query" value={query ?? data.connection.searchQuery} onChange={event => setQuery(event.target.value)} maxLength={1000} required disabled={pending} /><FieldDescription>The current order/inquiry subject filter stays in place. This uses Gmail search; changing it checks the last 30 days again. Dashboard search above filters emails already imported.</FieldDescription></Field>
          <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={pending}>Save import filter</Button><Button type="button" size="sm" variant="ghost" onClick={() => setQuery(data.defaultQuery)}>Use default</Button></div>
        </form>
      </>}
      {data && !data.configured && <p className="text-sm text-destructive">Gmail needs to be configured on the server before connecting.</p>}
      <div className="flex flex-wrap gap-2">{data?.configured && <Button asChild size="sm"><a href="/api/gmail/connect">{data.connection ? "Reconnect Gmail" : "Connect Gmail"}</a></Button>}{data?.connection && <><Button size="sm" variant="outline" disabled={pending} onClick={() => run(markAllGmailNotificationsReadAction, "All alerts marked as read.")}>Mark all read</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => run(disconnectGmailAction, "Mailbox disconnected. Stored email data and links removed.")}>Disconnect</Button></>}</div>
    </div>
  </details>;
}
