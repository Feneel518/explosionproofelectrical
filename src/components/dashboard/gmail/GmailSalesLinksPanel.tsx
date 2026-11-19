"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CalendarClock, FilePlus2, ShoppingCart, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSalesDraftFromGmailAction, getGmailSalesLinksAction, unlinkGmailSalesRecordAction, type GmailSalesLinks } from "@/lib/actions/dashboard/gmail/salesLinksActions";
import ScheduleFollowupDialog from "@/components/dashboard/sales/quotation/ScheduleFollowupDialog";
import { createDraftSalesOrderAction } from "@/lib/actions/dashboard/sales/order/createDraftSalesOrderAction";
import { GmailSuggestions } from "./GmailSuggestions";

export function GmailSalesLinksPanel({ id, subject, onChanged }: { id: string; subject: string; onChanged: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<GmailSalesLinks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followupQuote, setFollowupQuote] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pending, startTransition] = useTransition();
  useEffect(() => { let active = true; getGmailSalesLinksAction(id).then(result => { if (active) setData(result); }).catch(() => { if (active) setError("Sales links could not be loaded."); }); return () => { active = false; }; }, [id, revision]);

  const mutate = (work: () => Promise<unknown>, success: string) => startTransition(async () => {
    try { await work(); setData(await getGmailSalesLinksAction(id)); onChanged(); toast.success(success); }
    catch { toast.error("Could not update the sales link. Please try again."); }
  });
  const create = (type: "QUOTATION" | "ORDER") => startTransition(async () => {
    try { const record = await createSalesDraftFromGmailAction(id, type); onChanged(); router.push(record.href); }
    catch { toast.error("Could not create a draft. Please try again."); }
  });

  return <details className="border-t px-4 py-4 sm:px-6">
    <summary className="cursor-pointer text-sm font-medium">Sales tools{data?.links.length ? ` · ${data.links.length} linked ${data.links.length === 1 ? "record" : "records"}` : " · Link mail, quotations & orders"}</summary>
    <section aria-label="Sales tools" className="mt-4 flex flex-col gap-4">
    <div className="flex flex-wrap gap-2"><GmailSuggestions notificationId={id} subject={subject} onLinked={() => { setRevision(value => value + 1); onChanged(); }} /></div>
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
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => create("QUOTATION")}><FilePlus2 data-icon="inline-start" />{data?.links.some(link => link.kind === "QUOTATION" && link.status === "DRAFT") ? "Open quotation draft" : "Create quotation"}</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => create("ORDER")}><ShoppingCart data-icon="inline-start" />{data?.links.some(link => link.kind === "ORDER" && link.status === "DRAFT") ? "Open order draft" : "Create order draft"}</Button></div>
    <p className="text-xs leading-5 text-muted-foreground">Drafts stay editable until you review and finalize them. Linked records include future replies.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  </details>;
}
