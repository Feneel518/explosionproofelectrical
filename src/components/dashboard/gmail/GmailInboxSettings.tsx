"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { disconnectGmailAction, markAllGmailNotificationsReadAction, updateGmailFilterAction } from "@/lib/actions/dashboard/gmail/inboxActions";
import { useGmailNotifications } from "./GmailNotificationsProvider";

export function GmailInboxSettings() {
  const { data, refresh } = useGmailNotifications();
  const [query, setQuery] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<void>, message: string) => startTransition(async () => {
    try { await work(); await refresh(); toast.success(message); } catch { toast.error("Could not save mailbox settings. Please try again."); }
  });
  return <Dialog>
    <DialogTrigger asChild><Button variant="ghost" size="sm"><Settings2 data-icon="inline-start" />Settings</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>Mailbox settings</DialogTitle><DialogDescription>{data?.connection?.email || "Connect the Gmail account that receives customer emails."}</DialogDescription></DialogHeader>
    <div className="flex flex-col gap-5">
      {data?.connection && <>
        {!data.connection.canSend && <p role="status" className="text-sm text-muted-foreground">Reconnect Gmail and allow sending to email quotations with their customer-copy PDF attached.</p>}
        <p className="text-sm leading-6 text-muted-foreground">{data.backgroundEnabled ? "Mail updates every five minutes, and every minute while the dashboard is open." : "Mail updates every minute while the dashboard is open."}</p>
        <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); run(() => updateGmailFilterAction(query ?? data.connection!.searchQuery), "Mail import filter saved."); }}>
          <Field><FieldLabel htmlFor="gmail-import-query">Email import rule</FieldLabel><Input id="gmail-import-query" value={query ?? data.connection.searchQuery} onChange={event => setQuery(event.target.value)} maxLength={1000} required disabled={pending} /><FieldDescription>Uses Gmail search syntax. Saving checks the last 30 days for matching emails. Search in the inbox only covers imported mail.</FieldDescription></Field>
          <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={pending}>Save import filter</Button><Button type="button" size="sm" variant="ghost" onClick={() => setQuery(data.defaultQuery)}>Use default</Button></div>
        </form>
      </>}
      {data && !data.configured && <p className="text-sm text-destructive">Gmail needs to be configured on the server before connecting.</p>}
      <div className="flex flex-wrap gap-2 border-t pt-4">{data?.configured && <Button asChild size="sm" variant={data.connection ? "outline" : "default"}><a href="/api/gmail/connect">{data.connection ? "Reconnect Gmail" : "Connect Gmail"}</a></Button>}{data?.connection && <><Button size="sm" variant="outline" disabled={pending} onClick={() => run(markAllGmailNotificationsReadAction, "All alerts marked as read.")}>Mark all read</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => run(disconnectGmailAction, "Mailbox disconnected. Stored email data and links removed.")}>Disconnect</Button></>}</div>
    </div>
    </DialogContent>
  </Dialog>;
}
