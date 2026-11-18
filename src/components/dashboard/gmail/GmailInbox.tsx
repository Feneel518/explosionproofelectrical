"use client";

import { useEffect, useState, useTransition } from "react";
import { ExternalLink, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { disconnectGmailAction, getGmailAlertsAction, markAllGmailNotificationsReadAction, markGmailNotificationReadAction, updateGmailFilterAction } from "@/lib/actions/dashboard/gmail/inboxActions";
import { useGmailNotifications } from "./GmailNotificationsProvider";

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));

export function GmailInbox({ outcome }: { outcome?: string }) {
  const { data, loading, error, refresh } = useGmailNotifications();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [history, setHistory] = useState({ page: 1, search: "" });
  const historyKey = JSON.stringify(history);
  const customHistory = history.page !== 1 || !!history.search;
  const [historyResult, setHistoryResult] = useState<{
    key: string; page: Awaited<ReturnType<typeof getGmailAlertsAction>> | null; error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!data || !customHistory) return;
    let active = true;
    getGmailAlertsAction(history).then(page => {
      if (active) setHistoryResult({ key: historyKey, page, error: null });
    }).catch(() => {
      if (active) setHistoryResult({ key: historyKey, page: null, error: "Could not load saved alerts. Use Refresh to try again." });
    });
    return () => { active = false; };
  }, [data, history, historyKey, customHistory]);
  const alerts = customHistory ? historyResult?.key === historyKey ? historyResult.page : null : data;
  const historyError = customHistory && historyResult?.key === historyKey ? historyResult.error : null;
  const historyLoading = loading || (customHistory && !alerts && !historyError);
  const connection = data?.connection;
  const run = (work: () => Promise<void>, success?: string) => startTransition(async () => {
    try { await work(); await refresh(); if (success) toast.success(success); }
    catch { toast.error("Could not complete this action. Please try again."); }
  });

  return <div className="mx-auto flex max-w-5xl flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Gmail inbox alerts</h1>
        <p className="text-sm text-muted-foreground">Orders and inquiries from your connected Gmail mailbox.</p>
      </div>
      <Button variant="outline" disabled={pending || loading} onClick={() => startTransition(() => refresh({ rescan: true }))}><RefreshCw data-icon="inline-start" />{pending ? "Checking..." : "Refresh"}</Button>
    </div>
    {outcome === "failed" && <p role="alert" className="text-sm text-destructive">Gmail could not be connected. Check the Google setup, then try again and allow read and send access.</p>}
    {outcome === "connected" && connection && <p role="status" className="text-sm">Gmail connected successfully.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Card>
      <CardHeader>
        <CardTitle>Connected mailbox</CardTitle>
        <CardDescription>Only your dashboard account can see this mailbox’s alerts. You can also send quotation PDFs from this mailbox.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? <Skeleton className="h-9 w-64 max-w-full" /> : connection ? <>
          <div className="flex flex-wrap items-center gap-2"><Mail aria-hidden="true" className="size-4" /><span className="break-all">{connection.email}</span><Badge variant="secondary">Connected</Badge></div>
          {!connection.canSend && <p role="status" className="text-sm text-muted-foreground">Reconnect Gmail and allow sending to email quotations with their PDF attached. Your inbox alerts will be preserved when you reconnect the same mailbox.</p>}
          <p className="text-sm text-muted-foreground">{connection.lastSyncedAt ? `Last checked ${dateLabel(connection.lastSyncedAt)} (IST).` : "Your first sync will check the last 30 days."} Checks run every minute while your dashboard is open and visible.</p>
          <form onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              await updateGmailFilterAction(query ?? connection.searchQuery);
              setQuery(null); setHistory({ page: 1, search: "" }); setSearchText("");
            }, "Gmail filter saved.");
          }} className="flex flex-col gap-3">
            <FieldGroup><Field>
              <FieldLabel htmlFor="gmail-filter">Which emails should trigger alerts?</FieldLabel>
              <Input id="gmail-filter" value={query ?? connection.searchQuery} onChange={(event) => setQuery(event.target.value)} maxLength={1000} required disabled={pending} />
              <FieldDescription>Uses Gmail search. The default checks purchase documents, order, inquiry, enquiry, RFQ and quotation subjects in Inbox. Archived emails need a query without in:inbox. Saving or refreshing rechecks the last 30 days unless your query specifies dates. Earlier saved alerts remain in your history.</FieldDescription>
            </Field></FieldGroup>
            <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={pending}>Save filter</Button><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setQuery(data?.defaultQuery ?? "")}>Use default</Button></div>
          </form>
        </> : <p className="text-sm text-muted-foreground">Connect the Gmail account that receives your customer emails. We’ll show the sender, subject and arrival time, with a link to open each email in Gmail.</p>}
        {!loading && data && !data.configured && <p role="status" className="text-sm text-destructive">Gmail setup needs to be completed on the server before you can connect.</p>}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {data?.configured && <Button asChild disabled={pending}><a href="/api/gmail/connect">{connection ? "Reconnect Gmail" : "Connect Gmail"}</a></Button>}
        {connection && <Button variant="outline" disabled={pending} onClick={() => run(disconnectGmailAction, "Gmail disconnected and stored alerts removed.")}>Disconnect Gmail</Button>}
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Orders &amp; inquiries {data && data.unreadCount > 0 && <Badge variant="secondary">{data.unreadCount} unread</Badge>}</CardTitle>
        <CardDescription>Browse all imported alerts, 100 per page. Search checks saved subjects and senders; the Gmail query above controls which emails are imported. Marking an alert read here leaves its Gmail read status unchanged.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4" aria-busy={historyLoading}>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={event => {
          event.preventDefault(); setHistory({ page: 1, search: searchText.trim() });
        }}>
          <FieldGroup className="flex-1"><Field><FieldLabel htmlFor="gmail-alert-search">Find a saved alert</FieldLabel><Input id="gmail-alert-search" type="search" placeholder="Subject or sender" value={searchText} onChange={event => setSearchText(event.target.value)} maxLength={200} disabled={!connection || pending} /></Field></FieldGroup>
          <Button type="submit" variant="outline" disabled={!connection || pending}>Search alerts</Button>
          {history.search && <Button type="button" variant="ghost" onClick={() => { setHistory({ page: 1, search: "" }); setSearchText(""); }}>Clear search</Button>}
        </form>
        {historyError && <p role="alert" className="text-sm text-destructive">{historyError}</p>}
        {historyLoading ? <Skeleton className="h-28 w-full" /> : !alerts?.notifications.length ? <p className="py-6 text-sm text-muted-foreground">{history.search ? "No saved alerts match this search. Try another subject or sender, or refresh Gmail to import matching emails." : connection ? "No matching emails yet. Check your Gmail query and its date range, then use Refresh." : "Connect Gmail to start receiving alerts."}</p> : <ul className="flex flex-col divide-y">
          {alerts.notifications.map((item) => <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-start gap-2"><p className="break-words font-medium [overflow-wrap:anywhere]">{item.subject}</p>{!item.read && <Badge variant="secondary">New</Badge>}</div>
              <p className="break-all text-sm text-muted-foreground">{item.sender}</p>
              <time className="text-xs text-muted-foreground" dateTime={item.receivedAt}>{dateLabel(item.receivedAt)} IST</time>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><a target="_blank" rel="noopener noreferrer" href={`https://mail.google.com/mail/u/?authuser=${encodeURIComponent(connection?.email ?? "")}#all/${encodeURIComponent(item.threadId)}`}>Open in Gmail<ExternalLink data-icon="inline-end" /></a></Button>
              {!item.read && <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => markGmailNotificationReadAction(item.id))}>Mark read</Button>}
            </div>
          </li>)}
        </ul>}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        {!!data?.unreadCount && <Button size="sm" variant="outline" disabled={pending} onClick={() => run(markAllGmailNotificationsReadAction)}>Mark all as read</Button>}
        {alerts && <nav aria-label="Gmail alert pages" className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">{alerts.pagination.total} {alerts.pagination.total === 1 ? "alert" : "alerts"} · Page {alerts.pagination.page} of {alerts.pagination.totalPages}</p>
          <Button size="sm" variant="outline" disabled={pending || historyLoading || alerts.pagination.page <= 1} onClick={() => setHistory(current => ({ ...current, page: alerts.pagination.page - 1 }))}>Previous page</Button>
          <Button size="sm" variant="outline" disabled={pending || historyLoading || alerts.pagination.page >= alerts.pagination.totalPages} onClick={() => setHistory(current => ({ ...current, page: alerts.pagination.page + 1 }))}>Next page</Button>
        </nav>}
      </CardFooter>
    </Card>
  </div>;
}
