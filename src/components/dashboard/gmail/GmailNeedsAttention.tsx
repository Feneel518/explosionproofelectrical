"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSalesAttentionAction, type SalesAttentionData } from "@/lib/actions/dashboard/gmail/attentionAction";
import type { AttentionCategory } from "@/lib/gmail/attention";

const categories: { id: AttentionCategory; label: string; href: string }[] = [
  { id: "MESSAGES", label: "New messages", href: "/dashboard/inbox" },
  { id: "READY", label: "Ready to send", href: "/dashboard/sales/quotations?status=READY" },
  { id: "FOLLOWUPS", label: "Follow-ups due", href: "/dashboard/sales/quotations?followUp=OVERDUE" },
  { id: "ORDERS", label: "Orders to review", href: "/dashboard/sales/orders?status=DRAFT" },
];

export function GmailNeedsAttention({ revision, syncedAt, onOpenConversation, onShowNewMessages }: {
  revision: number; syncedAt: string | null; onOpenConversation: (id: string) => void; onShowNewMessages: () => void;
}) {
  const [data, setData] = useState<SalesAttentionData | null>(null);
  const [category, setCategory] = useState<AttentionCategory | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    getSalesAttentionAction().then((result) => { if (active) { setData(result); setError(false); } })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, syncedAt, retry]);
  const visible = data?.items.filter((item) => category === "ALL" || item.category === category) || [];
  return <section aria-label="Sales tasks needing attention" className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1"><h2 className="text-lg font-semibold">Your next actions {data && <Badge variant="secondary">{data.total}</Badge>}</h2><p className="text-sm text-muted-foreground">Review new messages, send ready quotations, and keep follow-ups and orders moving. Messages stay here until you reply or mark them Working or Done.</p></div>
      <Button size="sm" variant="outline" disabled={loading} onClick={() => { setLoading(true); setRetry((value) => value + 1); }}><RefreshCw data-icon="inline-start" />Refresh tasks</Button>
    </div>
    <Tabs value={category} onValueChange={(value) => setCategory(value as AttentionCategory | "ALL")}>
      <TabsList className="max-w-full flex-wrap justify-start group-data-[orientation=horizontal]/tabs:h-auto"><TabsTrigger className="h-9 flex-none" value="ALL">All {data?.total ?? ""}</TabsTrigger>{categories.map((item) => <TabsTrigger className="h-9 flex-none" key={item.id} value={item.id}>{item.label} {data?.counts[item.id] ?? ""}</TabsTrigger>)}</TabsList>
    </Tabs>
    {error ? <p role="alert" className="text-sm text-destructive">Could not load your tasks. Use Refresh tasks to try again.</p>
      : loading && !data ? <Skeleton className="h-52 w-full" />
      : !visible.length ? <div className="flex flex-col gap-1 py-8"><p className="font-medium">{category === "ALL" ? "You're up to date" : "Nothing waiting here"}</p><p className="text-sm text-muted-foreground">New customer messages and the next sales actions will appear here.</p></div>
      : <ul className="divide-y">{visible.map((item) => <li key={item.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1"><div><Badge variant={item.category === "FOLLOWUPS" ? "outline" : "secondary"}>{categories.find((entry) => entry.id === item.category)?.label}</Badge></div><p className="break-words font-medium [overflow-wrap:anywhere]">{item.title}</p><p className="break-all text-sm text-muted-foreground">{item.customer}</p><p className="text-xs text-muted-foreground">{item.detail} · {new Date(item.date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</p></div>
        {item.notificationId ? <Button size="sm" variant="outline" onClick={() => onOpenConversation(item.notificationId!)}>{item.action}<ArrowRight data-icon="inline-end" /></Button>
          : <Button asChild size="sm" variant="outline"><Link href={item.href}>{item.action}<ArrowRight data-icon="inline-end" /></Link></Button>}
      </li>)}</ul>}
    {data && categories.some((item) => data.counts[item.id] > 10 && (category === "ALL" || item.id === category)) && <div className="flex flex-wrap items-center gap-2 border-t pt-3"><p className="text-xs text-muted-foreground">Showing up to 10 items per category.</p>{categories.filter((item) => data.counts[item.id] > 10 && (category === "ALL" || item.id === category)).map((item) => item.id === "MESSAGES" ? <Button key={item.id} size="sm" variant="ghost" onClick={onShowNewMessages}>View all new messages</Button> : <Button asChild key={item.id} size="sm" variant="ghost"><Link href={item.href}>View all {item.label.toLowerCase()}</Link></Button>)}</div>}
  </section>;
}
