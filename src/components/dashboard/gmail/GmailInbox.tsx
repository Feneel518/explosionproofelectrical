"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Inbox, Paperclip, RefreshCw, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { listGmailMessagesAction, type InboxFilters, type InboxPageData } from "@/lib/actions/dashboard/gmail/messageActions";
import { useGmailNotifications } from "./GmailNotificationsProvider";
import { GmailInboxSettings } from "./GmailInboxSettings";
import { GmailConversationPane } from "./GmailConversationPane";
import { InboxSelect } from "./GmailInboxControls";

const initialFilters: InboxFilters = { search: "", sender: "", read: "ALL", status: "ALL", attachment: false, starred: false, linked: "ALL", salesView: "ALL", from: "", to: "", page: 1 };
const shortDate = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));

export function GmailInbox({ outcome, initialMessage }: { outcome?: string; initialMessage?: string }) {
  const { data, loading: connectionLoading, error: syncError, refresh } = useGmailNotifications();
  const [filters, setFilters] = useState<InboxFilters>(initialFilters);
  const [page, setPage] = useState<InboxPageData | null>(null);
  const [selected, setSelected] = useState<string | null>(initialMessage || null);
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pending, startTransition] = useTransition();
  const change = (patch: Partial<InboxFilters>) => setFilters(previous => ({ ...previous, ...patch, page: 1 }));
  const reload = useCallback(() => { setRevision(value => value + 1); void refresh(); }, [refresh]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await listGmailMessagesAction(filters);
        if (!active) return;
        setPage(result); setError(null);
      } catch { if (active) setError("Could not load emails. Refresh to try again."); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); active = false; };
  }, [filters, revision, data?.connection?.lastSyncedAt, data?.connection?.lastSyncAttemptAt]);

  const totalPages = Math.max(1, Math.ceil((page?.total || 0) / (page?.pageSize || 30)));
  const currentPage = filters.page || 1;
  const activeTab = filters.starred ? "STARRED" : filters.read === "UNREAD" ? "UNREAD" : filters.salesView || "ALL";
  const filterCount = [filters.sender, filters.from, filters.to, filters.status !== "ALL", filters.linked !== "ALL", filters.attachment].filter(Boolean).length;
  const hasFilters = !!filters.search || filterCount > 0 || activeTab !== "ALL";
  const selectTab = (value: string) => {
    setSelected(null);
    setLoading(true);
    setPage(null);
    setError(null);
    change({
      read: value === "UNREAD" ? "UNREAD" : "ALL",
      starred: value === "STARRED",
      salesView: value === "QUOTATION" || value === "ORDER" ? value : "ALL",
    });
  };
  return <div className="flex min-w-0 flex-col gap-5 [--ring:var(--foreground)] selection:bg-primary/30">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Mail</h1>
        <p className="break-all text-sm text-muted-foreground">{data?.connection?.email || "Customer orders and enquiries, in one inbox."}</p>
        {data?.connection && <p className="text-xs text-muted-foreground">{data.connection.lastSyncedAt ? `Last checked ${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(data.connection.lastSyncedAt))} IST` : "Waiting for the first mail check"} · {data.backgroundEnabled ? "Updates automatically" : "Updates while open"}</p>}
      </div>
      <div className="flex items-center gap-2">
        <GmailInboxSettings />
        <Button variant="outline" size="sm" disabled={pending || connectionLoading || !data?.connection} onClick={() => startTransition(async () => { await refresh({ rescan: true }); setRevision(value => value + 1); })}><RefreshCw data-icon="inline-start" className={cn(pending && "animate-spin motion-reduce:animate-none")} />{pending ? "Checking…" : "Check mail"}</Button>
      </div>
    </header>
    {outcome === "connected" && data?.connection && <p role="status" className="text-sm">Gmail connected. Your customer conversations are ready below.</p>}
    {outcome === "failed" && <p role="alert" className="text-sm text-destructive">Gmail could not be connected. Check Google access and try again in mailbox settings.</p>}
    {syncError && <p role="alert" className="text-sm text-destructive">{syncError}</p>}
    <Tabs value={activeTab} onValueChange={selectTab} className="gap-4">
      <TabsList variant="line" aria-label="Mail views" className="max-w-full flex-wrap justify-start group-data-[orientation=horizontal]/tabs:h-auto">
        <TabsTrigger value="ALL" className="h-10 flex-none px-3">All mail</TabsTrigger>
        <TabsTrigger value="QUOTATION" className="h-10 flex-none px-3">Quotations</TabsTrigger>
        <TabsTrigger value="ORDER" className="h-10 flex-none px-3">Sales orders</TabsTrigger>
        <TabsTrigger value="UNREAD" className="h-10 flex-none px-3">Unread{data?.unreadCount ? <span className="tabular-nums">({data.unreadCount})</span> : null}</TabsTrigger>
        <TabsTrigger value="STARRED" className="h-10 flex-none px-3">Starred</TabsTrigger>
      </TabsList>
    <TabsContent value={activeTab}>
    <div className="min-w-0 overflow-hidden rounded-xl border bg-background">
    <div className="flex flex-col gap-3 border-b p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-40"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search emails" maxLength={250} placeholder="Search mail…" className="pl-9" value={filters.search || ""} onChange={event => change({ search: event.target.value })} /></div>
        <Button variant={advanced || filterCount ? "secondary" : "outline"} aria-expanded={advanced} aria-controls="inbox-filters" onClick={() => setAdvanced(value => !value)}><SlidersHorizontal data-icon="inline-start" />Filters{filterCount > 0 ? ` (${filterCount})` : ""}</Button>
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => setFilters(initialFilters)}><X data-icon="inline-start" />Clear</Button>}
      </div>
      {advanced && <div id="inbox-filters" className="pt-2">
        <FieldGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Field><FieldLabel htmlFor="mail-sender">Sender</FieldLabel><Input id="mail-sender" maxLength={250} placeholder="Name or email" value={filters.sender || ""} onChange={event => change({ sender: event.target.value })} /></Field>
          <Field><FieldLabel htmlFor="mail-from">From date</FieldLabel><Input id="mail-from" type="date" value={filters.from || ""} onChange={event => change({ from: event.target.value })} /></Field>
          <Field><FieldLabel htmlFor="mail-to">To date</FieldLabel><Input id="mail-to" type="date" min={filters.from || undefined} value={filters.to || ""} onChange={event => change({ to: event.target.value })} /></Field>
          <Field><FieldLabel>Work status</FieldLabel><InboxSelect label="Filter work status" value={filters.status || "ALL"} onChange={value => change({ status: value as InboxFilters["status"] })} options={[["ALL", "All statuses"], ["NEW", "New"], ["IN_PROGRESS", "Working"], ["DONE", "Done"]]} /></Field>
          <Field><FieldLabel>Sales records</FieldLabel><InboxSelect label="Filter sales links" value={filters.linked || "ALL"} onChange={value => change({ linked: value as InboxFilters["linked"] })} options={[["ALL", "All emails"], ["LINKED", "Linked to sales"], ["UNLINKED", "Not linked yet"]]} /></Field>
        </FieldGroup>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={!!filters.attachment} onCheckedChange={checked => change({ attachment: checked === true })} />Has attachments</label>
      </div>}
    </div>
    {error && <div className="flex flex-wrap items-center gap-3 p-4"><p role="alert" className="text-sm text-destructive">{error}</p><Button size="sm" variant="outline" onClick={() => setRevision(value => value + 1)}>Try again</Button></div>}
    <div className="grid min-h-[520px] min-w-0 lg:h-[calc(100dvh-20rem)] lg:min-h-[560px] lg:max-h-[1000px] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
      <section aria-label="Email list" className={cn("min-h-0 min-w-0 flex-col lg:border-r", selected ? "hidden lg:flex" : "flex")}>
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3"><h2 className="text-sm font-medium">Messages</h2><p className="text-xs tabular-nums text-muted-foreground" role="status">{loading ? "Loading…" : `${page?.total || 0} emails`}</p></div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]" aria-busy={loading}>
          {!page && loading ? <div className="flex flex-col gap-3 p-4">{[1, 2, 3, 4, 5].map(value => <Skeleton key={value} className="h-24 w-full" />)}</div> : !page && error ? null : !page?.messages.length ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"><Inbox className="size-8 text-muted-foreground" aria-hidden="true" /><h2 className="font-medium">{data?.connection ? hasFilters ? "No matching emails" : "Your inbox is empty" : "Connect your mailbox"}</h2><p className="max-w-xs text-sm leading-6 text-muted-foreground">{data?.connection ? hasFilters ? "Try another search or clear your filters." : "Customer orders and enquiries will appear here when mail is checked." : "Connect Gmail to read customer orders and enquiries here."}</p>{data?.connection ? hasFilters && <Button variant="outline" size="sm" onClick={() => setFilters(initialFilters)}>Clear filters</Button> : data?.configured && <Button asChild size="sm"><a href="/api/gmail/connect">Connect Gmail</a></Button>}</div> : <ul className="divide-y">
            {page.messages.map(message => <li key={message.id}><button type="button" onClick={() => setSelected(message.id)} aria-pressed={selected === message.id} className={cn("flex w-full min-w-0 flex-col gap-2 p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", selected === message.id && "bg-accent")}>
              <div className="flex min-w-0 items-center gap-2">{!message.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}<span className={cn("min-w-0 flex-1 truncate text-sm", !message.read && "font-semibold")}>{message.sender.replace(/<[^>]+>/g, "").replaceAll('"', "").trim() || message.sender}</span>{message.starred && <Star className="size-3.5 shrink-0 fill-current" aria-label="Starred" />}<time dateTime={message.receivedAt} className="shrink-0 text-xs tabular-nums text-muted-foreground">{shortDate(message.receivedAt)}</time></div>
              <p className={cn("line-clamp-2 text-sm leading-5", !message.read && "font-medium")}>{message.subject}</p>{message.snippet && <p className="line-clamp-1 text-xs leading-5 text-muted-foreground">{message.snippet}</p>}
              {(message.hasAttachments || message.status !== "NEW" || message.links.length > 0) && <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{message.hasAttachments && <Paperclip className="size-3.5" aria-label="Has attachments" />}{message.status !== "NEW" && <span>{message.status === "DONE" ? "Done" : "In progress"}</span>}{message.links.slice(0, 2).map(link => <Badge key={link} variant="outline">{link}</Badge>)}</div>}
            </button></li>)}
          </ul>}
        </div>
        <footer className="flex items-center justify-between gap-2 border-t px-3 py-2"><Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={currentPage <= 1 || loading} onClick={() => setFilters(previous => ({ ...previous, page: currentPage - 1 }))}><ChevronLeft /></Button><span className="text-xs tabular-nums text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={currentPage >= totalPages || loading} onClick={() => setFilters(previous => ({ ...previous, page: currentPage + 1 }))}><ChevronRight /></Button></footer>
      </section>
      <section aria-label="Email reader" className={cn("min-h-0 min-w-0 overflow-y-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]", !selected && "hidden lg:block")}>
        {selected ? <GmailConversationPane key={selected} id={selected} onBack={() => setSelected(null)} onChanged={reload} /> : <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 p-8 text-center"><Inbox className="size-8 text-muted-foreground" aria-hidden="true" /><h2 className="text-lg font-medium">Select an email</h2><p className="max-w-xs text-sm leading-6 text-muted-foreground">Read the conversation and view attachments here.</p></div>}
      </section>
    </div>
    {page?.unindexed ? <p className="border-t px-4 py-2 text-xs text-muted-foreground">{page.unindexed} older emails are being indexed for search.</p> : null}
    </div>
    </TabsContent>
    </Tabs>
  </div>;
}
