"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Check, Link2, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGmailSuggestionsAction, searchGmailSalesSuggestionsAction, linkGmailSalesSuggestionAction, extractGmailProductSuggestionsAction } from "@/lib/actions/dashboard/gmail/suggestionActions";
import type { RankedCatalogSuggestion } from "@/lib/gmail/suggestions";

type Suggestions = Awaited<ReturnType<typeof getGmailSuggestionsAction>>;
type Mode = "links" | "products";

function mergeSalesSuggestions(first: Suggestions["suggestions"], second: Suggestions["suggestions"]) {
  const merged = new Map<string, Suggestions["suggestions"][number]>();
  for (const row of [...first, ...second]) {
    const key = `${row.kind}:${row.id}`;
    if (!merged.has(key) || row.score > merged.get(key)!.score) merged.set(key, row);
  }
  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, 15);
}

function SuggestionsReview({ notificationId, initialMode, onLinked }: { notificationId: string; initialMode: Mode; onLinked?: () => void }) {
  const id = useId();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [data, setData] = useState<Suggestions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [partId, setPartId] = useState("");
  const [selected, setSelected] = useState<Record<string, RankedCatalogSuggestion>>({});
  const [searchResult, setSearchResult] = useState<{ query: string; suggestions: Suggestions["suggestions"] } | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let result = await getGmailSuggestionsAction(notificationId);
        if (!active) return;
        if (result.attachments.length === 1) {
          try {
            const extracted = await extractGmailProductSuggestionsAction(notificationId, { partId: result.attachments[0].partId });
            result = { ...result, products: [...new Map([...result.products, ...extracted.products].map(row => [row.description, row])).values()], suggestions: mergeSalesSuggestions(result.suggestions, extracted.suggestions), poNumbers: [...new Set([...result.poNumbers, ...extracted.poNumbers])], warning: extracted.warning || result.warning };
          } catch { result = { ...result, warning: "Could not read the PDF. You can retry below or paste its product descriptions." }; }
        }
        if (active) { setData(result); setPartId(result.attachments[0]?.partId ?? ""); setError(null); }
      } catch { if (active) setError("Could not load suggestions. Try again."); }
    }
    void load();
    return () => { active = false; };
  }, [notificationId, initialMode, attempt]);

  function run(work: () => Promise<void>) {
    startTransition(async () => {
      setError(null);
      try { await work(); } catch { setError("Could not complete this action. Please try again."); }
    });
  }
  const rows = searchResult?.suggestions ?? data?.suggestions ?? [];
  async function extract(options: { text?: string; partId?: string }) {
    const result = await extractGmailProductSuggestionsAction(notificationId, options);
    setSelected({});
    setData(previous => previous ? { ...previous, products: result.products, suggestions: mergeSalesSuggestions(previous.suggestions, result.suggestions), poNumbers: [...new Set([...previous.poNumbers, ...result.poNumbers])], warning: result.warning } : previous);
    setSearchResult(null);
  }

  return <div className="flex min-w-0 flex-col gap-4">
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!data ? <div className="flex flex-col items-start gap-3 py-6"><p role="status" className="text-sm text-muted-foreground">{error ? "Suggestions are unavailable." : "Reading the email and finding suggestions…"}</p>{error && <Button variant="outline" onClick={() => { setError(null); setAttempt(value => value + 1); }}>Try again</Button>}</div> : <>
      {data.warning && <div className="flex flex-col items-start gap-2"><p role="status" className="text-sm text-muted-foreground">{data.warning}</p><Button size="sm" variant="ghost" disabled={pending} onClick={() => { setData(null); setAttempt(value => value + 1); }}>Reload email</Button></div>}
      <Tabs value={mode} onValueChange={value => setMode(value as Mode)}>
        <TabsList><TabsTrigger value="links">Link mail</TabsTrigger><TabsTrigger value="products">Product suggestions</TabsTrigger></TabsList>
        <TabsContent value="links" className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Suggested orders and quotations based on the sender, customer name and PO number. Select a record to link this conversation.</p>
          {data.poNumbers.length > 0 && <p className="break-words text-sm">Detected PO: {data.poNumbers.join(", ")}</p>}
          <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); const value = query.trim(); run(async () => {
            const result = await searchGmailSalesSuggestionsAction(notificationId, value);
            setSearchResult({ query: value, suggestions: result.suggestions });
          }); }}>
            <div className="flex min-w-0 flex-1 flex-col gap-2"><Label htmlFor={`${id}-search`}>Customer name or PO number</Label><Input id={`${id}-search`} value={query} onChange={event => setQuery(event.target.value)} minLength={2} maxLength={200} required placeholder="Search another name or PO" disabled={pending} /></div>
            <Button type="submit" variant="outline" disabled={pending || query.trim().length < 2}>Search</Button>
            {searchResult && <Button type="button" variant="ghost" disabled={pending} onClick={() => setSearchResult(null)}>Show automatic suggestions</Button>}
          </form>
          <p role="status" className="text-xs text-muted-foreground">{pending ? "Updating suggestions…" : searchResult ? `Search results for “${searchResult.query}”` : "Automatic suggestions · best matches first"}</p>
          {!rows.length ? <p className="py-4 text-sm text-muted-foreground">No matching orders or quotations found. Search a customer name or PO number, or read a PDF in Product suggestions to include its customer details.</p> : <ul className="divide-y">{rows.map(row => <li key={`${row.kind}:${row.id}`} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1"><p className="font-medium">{row.label}</p><p className="break-words text-sm">{row.customer}{row.poNumber ? ` · PO ${row.poNumber}` : ""}</p><p className="text-xs text-muted-foreground">{row.reasons.join(" · ") || "Search match"}</p></div>
            <Button size="sm" variant={row.linked ? "secondary" : "outline"} disabled={pending || row.linked} onClick={() => run(async () => {
              await linkGmailSalesSuggestionAction(notificationId, row.kind, row.id);
              const markLinked = (items: Suggestions["suggestions"]) => items.map(item => item.kind === row.kind && item.id === row.id ? { ...item, linked: true } : item);
              setData(previous => previous ? { ...previous, suggestions: markLinked(previous.suggestions) } : previous);
              setSearchResult(previous => previous ? { ...previous, suggestions: markLinked(previous.suggestions) } : previous);
              onLinked?.();
              toast.success("Mail linked to the sales record.");
            })}>{row.linked ? <><Check aria-hidden="true" />Linked</> : "Link mail"}</Button>
          </li>)}</ul>}
        </TabsContent>
        <TabsContent value="products" className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Matches come from the active product and variant catalog, including SKU, type number and rating. Review alternatives before selecting.</p>
          {data.attachments.length > 0 && <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); run(() => extract({ partId })); }}>
            <div className="flex min-w-0 flex-1 flex-col gap-2"><Label htmlFor={`${id}-pdf`}>Extract from a PDF</Label><select id={`${id}-pdf`} value={partId} onChange={event => setPartId(event.target.value)} disabled={pending} className="h-9 w-full min-w-0 rounded-md border bg-background px-3 text-sm">{data.attachments.map(file => <option key={file.partId} value={file.partId}>{file.filename}</option>)}</select></div>
            <Button type="submit" variant="outline" disabled={pending || !partId}>Read PDF &amp; suggest</Button>
          </form>}
          <form className="flex flex-col items-start gap-2" onSubmit={event => { event.preventDefault(); run(() => extract({ text: description.trim() })); }}>
            <Label htmlFor={`${id}-description`}>Product descriptions</Label><Textarea id={`${id}-description`} value={description} onChange={event => setDescription(event.target.value)} maxLength={50_000} placeholder="Paste or edit product descriptions, one item per line" disabled={pending} />
            <Button type="submit" variant="outline" disabled={pending || description.trim().length < 2}>{pending ? "Finding suggestions…" : "Find product & variant suggestions"}</Button>
          </form>
          <div aria-live="polite" aria-busy={pending}>{!data.products.length ? <p className="py-4 text-sm text-muted-foreground">No catalog matches found in the email text. Read an attached PDF or enter a product description above.</p> : <ul className="flex flex-col gap-4">{data.products.map((row, index) => <li key={`${index}:${row.description}`} className="rounded-lg border p-3">
            <p className="mb-2 break-words text-sm font-medium">{row.description}</p>
            <ul className="divide-y">{row.suggestions.map(item => {
              const chosen = selected[String(index)]?.productId === item.productId && selected[String(index)]?.variantId === item.variantId;
              return <li key={`${item.productId}:${item.variantId ?? "product"}`} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 flex-col gap-1"><p className="break-words text-sm">{item.productName}</p><p className="break-words text-sm text-muted-foreground">{item.variantName || "Product family · no active variants"}</p><p className="break-words text-xs text-muted-foreground">{[item.sku && `SKU ${item.sku}`, item.typeNumber && `Type ${item.typeNumber}`, item.rating].filter(Boolean).join(" · ")}</p><div className="flex flex-wrap gap-1">{item.reasons.map(reason => <Badge key={reason} variant="secondary">{reason}</Badge>)}</div></div><Button type="button" variant={chosen ? "secondary" : "outline"} size="sm" disabled={pending} onClick={() => setSelected(previous => chosen ? Object.fromEntries(Object.entries(previous).filter(([key]) => key !== String(index))) : { ...previous, [String(index)]: item })}>{chosen ? <><Check aria-hidden="true" />Selected</> : "Select suggestion"}</Button></li>;
            })}</ul>
          </li>)}</ul>}</div>
          {Object.keys(selected).length > 0 && <div className="flex flex-col items-start gap-2 border-t pt-3"><p className="text-sm">{Object.keys(selected).length} catalog {Object.keys(selected).length === 1 ? "item" : "items"} selected for review.</p><Button variant="outline" size="sm" onClick={() => run(async () => {
            await navigator.clipboard.writeText(Object.values(selected).map(item => [item.productName, item.variantName, item.sku && `SKU: ${item.sku}`, item.typeNumber && `Type: ${item.typeNumber}`, item.rating].filter(Boolean).join(" · ")).join("\n"));
            toast.success("Selected catalog items copied.");
          })} disabled={pending}>Copy selected items</Button></div>}
        </TabsContent>
      </Tabs>
    </>}
  </div>;
}

export function GmailSuggestions({ notificationId, subject, onLinked }: { notificationId: string; subject: string; onLinked?: () => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  return <>
    <Button size="sm" variant="outline" onClick={() => setMode("links")}><Link2 data-icon="inline-start" />Link mail</Button>
    <Button size="sm" variant="outline" onClick={() => setMode("products")}><PackageSearch data-icon="inline-start" />Find products</Button>
    <Dialog open={mode !== null} onOpenChange={open => { if (!open) setMode(null); }}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{mode === "links" ? "Link mail to a quotation or order" : "Find products from this email"}</DialogTitle><DialogDescription className="break-words pr-4">{subject}</DialogDescription></DialogHeader>{mode && <SuggestionsReview notificationId={notificationId} initialMode={mode} onLinked={onLinked} />}</DialogContent></Dialog>
  </>;
}
