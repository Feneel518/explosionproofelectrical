"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CalendarClock, FilePlus2, Link2, ShoppingCart, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createSalesDraftFromGmailAction, getGmailSalesLinksAction, linkGmailSalesRecordAction, searchGmailSalesRecordsAction, unlinkGmailSalesRecordAction, type GmailSalesLinks } from "@/lib/actions/dashboard/gmail/salesLinksActions";
import ScheduleFollowupDialog from "@/components/dashboard/sales/quotation/ScheduleFollowupDialog";
import { createDraftSalesOrderAction } from "@/lib/actions/dashboard/sales/order/createDraftSalesOrderAction";
import { InboxSelect } from "./GmailInboxControls";

export function GmailSalesLinksPanel({ id, onChanged }: { id: string; onChanged: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<GmailSalesLinks | null>(null);
  const [kind, setKind] = useState<"QUOTATION" | "ORDER">("QUOTATION");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchGmailSalesRecordsAction>>>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followupQuote, setFollowupQuote] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pending, startTransition] = useTransition();
  useEffect(() => { let active = true; getGmailSalesLinksAction(id).then(result => { if (active) setData(result); }).catch(() => { if (active) setError("Sales links could not be loaded."); }); return () => { active = false; }; }, [id, revision]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try { const found = await searchGmailSalesRecordsAction(kind, search); if (active) { setResults(found); setError(null); } }
      catch { if (active) setError("Could not search sales records. Try again."); }
      finally { if (active) setSearching(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [kind, search, open]);

  const mutate = (work: () => Promise<unknown>, success: string) => startTransition(async () => {
    try { await work(); setData(await getGmailSalesLinksAction(id)); onChanged(); toast.success(success); }
    catch { toast.error("Could not update the sales link. Please try again."); }
  });
  const create = (type: "QUOTATION" | "ORDER") => startTransition(async () => {
    try { const record = await createSalesDraftFromGmailAction(id, type); onChanged(); router.push(record.href); }
    catch { toast.error("Could not create a draft. Please try again."); }
  });

  return <section aria-label="Linked sales records" className="flex flex-col gap-3 border-y bg-muted/20 px-4 py-4 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Sales records</h2><p className="text-xs text-muted-foreground">Links include future replies in this conversation.</p></div>
    {data?.customer && <Link href={`/dashboard/customers/${data.customer.id}`} className="text-sm text-primary underline-offset-4 hover:underline">Known customer: {data.customer.companyName}{data.customer.city ? ` · ${data.customer.city}` : ""}</Link>}
    {data?.links.map(link => <div key={link.id} className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <div className="flex items-center gap-2"><Link href={link.href} className="min-w-0 flex-1 text-sm underline-offset-4 hover:underline"><span className="font-medium">{link.title}</span><span className="ml-2 text-muted-foreground">{link.subtitle}</span></Link><Badge variant="outline">{link.status.replaceAll("_", " ")}</Badge><Button size="icon-sm" variant="ghost" disabled={pending} aria-label={`Unlink ${link.title}`} onClick={() => mutate(() => unlinkGmailSalesRecordAction(link.id), "Conversation unlinked.")}><Unlink /></Button></div>
      {link.tracking && <p className="text-xs text-muted-foreground">{link.tracking}</p>}
      {link.kind === "QUOTATION" && !["WON", "LOST", "CANCELLED"].includes(link.status) && <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-xs text-muted-foreground">{link.nextFollowupAt ? `Follow-up: ${new Date(link.nextFollowupAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST` : "No follow-up scheduled"}</p>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setFollowupQuote(link.recordId)}><CalendarClock data-icon="inline-start" />Schedule follow-up</Button>
        {link.canCreateOrder && <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
          try { const result = await createDraftSalesOrderAction(link.recordId); if (!result.ok) { toast.error(result.message); return; } onChanged(); router.push(`/dashboard/sales/orders/${result.id}/edit`); }
          catch { toast.error("Could not prepare the order. Please try again."); }
        })}><ShoppingCart data-icon="inline-start" />Review &amp; create order</Button>}
      </div>}
    </div>)}
    {followupQuote && <ScheduleFollowupDialog quotationId={followupQuote} open onOpenChange={(next) => { if (!next) { setFollowupQuote(null); setRevision(value => value + 1); onChanged(); } }} />}
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => create("QUOTATION")}><FilePlus2 data-icon="inline-start" />{data?.links.some(link => link.kind === "QUOTATION" && link.status === "DRAFT") ? "Open quotation draft" : "Create quotation"}</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => create("ORDER")}><ShoppingCart data-icon="inline-start" />{data?.links.some(link => link.kind === "ORDER" && link.status === "DRAFT") ? "Open order draft" : "Create order draft"}</Button><Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpen(value => !value)}><Link2 data-icon="inline-start" />Link existing</Button></div>
    <p className="text-xs leading-5 text-muted-foreground">Customer sent an order in this thread? Choose Review & create order on the quotation above to carry its products, prices and conversation into an editable order. Review and finalize it yourself. No order is accepted automatically.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {open && <div className="flex flex-col gap-2"><div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]"><InboxSelect label="Sales record type" value={kind} onChange={value => setKind(value as typeof kind)} options={[["QUOTATION", "Quotations"], ["ORDER", "Sales orders"]]} /><Input aria-label="Find sales record" placeholder="Search customer, email, number or PO…" value={search} onChange={event => setSearch(event.target.value)} maxLength={150} /></div><div className="max-h-52 overflow-y-auto rounded-md border bg-background">{searching ? <p role="status" className="p-3 text-sm text-muted-foreground">Finding records…</p> : !results.length ? <p className="p-3 text-sm text-muted-foreground">No matching records. Try a customer name or document number.</p> : <ul className="divide-y">{results.map(record => <li key={record.id}><button type="button" disabled={pending} onClick={() => mutate(() => linkGmailSalesRecordAction(id, kind, record.id), "Conversation linked to sales record.")} className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><span className="min-w-0"><span className="block font-medium">{record.title}</span><span className="block truncate text-muted-foreground">{record.subtitle}</span></span><Badge variant="secondary">{record.status}</Badge></button></li>)}</ul>}</div></div>}
  </section>;
}
