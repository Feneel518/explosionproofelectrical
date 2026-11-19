"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileInput, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extractGmailOrderPdfAction, fillOrderFromGmailPdfAction } from "@/lib/actions/dashboard/gmail/pdfActions";
import { reviewedOrderPdfSchema, type ExtractedOrderPdf } from "@/lib/gmail/orderPdfSchema";
import { attachmentUrl } from "./GmailInboxControls";

type Reading = { id: string; filename: string; extraction: ExtractedOrderPdf };
type ReviewRow = ExtractedOrderPdf["items"][number] & { included: boolean; quantityInput: string; priceInput: string };

export function GmailPdfOrderImport({ id, messageId, partId, filename, onCreated }: {
  id: string; messageId: string; partId: string; filename: string; onCreated: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const read = () => {
    setOpen(true);
    if (reading || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await extractGmailOrderPdfAction({ id, messageId, partId });
        if (!result.ok) { setError(result.error); return; }
        setReading(result);
        setRows(result.extraction.items.map(item => ({ ...item, included: true, quantityInput: item.quantity === null ? "" : String(item.quantity), priceInput: item.unitPrice === null ? "" : String(item.unitPrice) })));
        setPoNumber(result.extraction.poNumber || "");
        setPoDate(/^\d{4}-\d{2}-\d{2}$/.test(result.extraction.poDate || "") ? result.extraction.poDate! : "");
        setBuyerName(result.extraction.buyerName || "");
      } catch { setError("The PDF could not be read. Try again, or enter the order manually."); }
    });
  };
  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setRows(previous => previous.map((row, position) => position === index ? { ...row, ...patch } : row));
    setReviewed(false);
  };
  const selected = rows.filter(row => row.included);
  const invalidRows = selected.filter(row => !row.title.trim() || !row.quantityInput.trim() || !Number.isInteger(Number(row.quantityInput)) || Number(row.quantityInput) <= 0 || !row.priceInput.trim() || !Number.isFinite(Number(row.priceInput)) || Number(row.priceInput) < 0).length;
  const foreignCurrency = !!reading?.extraction.currency && reading.extraction.currency.toUpperCase() !== "INR";
  const fill = () => {
    if (!reading) return;
    const review = reviewedOrderPdfSchema.safeParse({
      reviewed, currency: foreignCurrency ? reading.extraction.currency : "INR",
      poNumber: poNumber.trim() || null, poDate: poDate || null, buyerName: buyerName.trim() || null,
      items: selected.map(row => ({ title: row.title, description: row.description || null, sku: row.sku || null, typeNumber: row.typeNumber || null,
        quantity: row.quantityInput.trim() ? Number(row.quantityInput) : null, unit: row.unit || null,
        unitPrice: row.priceInput.trim() ? Number(row.priceInput) : null, hsnCode: row.hsnCode || null, page: row.page })),
    });
    if (!review.success) { setError("Review the selected items, whole quantities, unit prices, PO date and INR currency, then confirm the checkbox."); return; }
    setError(null);
    startTransition(async () => {
      try {
        const order = await fillOrderFromGmailPdfAction(reading.id, review.data);
        if (!order.ok) { setError(order.error); return; }
        onCreated();
        toast.success(order.reused ? "Opening the order already filled from this PDF." : `${selected.length} items filled into an order draft. Check products, taxes and terms before finalizing.`);
        setOpen(false);
        router.push(order.href);
      } catch { setError("The draft could not be filled. Please try again; your existing order items are preserved."); }
    });
  };

  return <>
    <Button size="sm" variant="outline" onClick={read}><FileInput data-icon="inline-start" />Extract order items</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Read order PDF</DialogTitle>
          <DialogDescription className="break-all">{reading?.filename || filename} · Review the extracted rows before filling a draft. AI reading can miss or misread details.</DialogDescription>
        </DialogHeader>
        {!reading && pending && <div role="status" className="flex min-h-44 flex-col items-center justify-center gap-3 text-center"><Loader2 className="size-6 animate-spin" aria-hidden="true" /><p className="text-sm font-medium">Reading the PDF and its item table…</p><p className="max-w-md text-sm text-muted-foreground">Scans can take longer. You can close this window and reopen the saved reading later.</p></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!reading && !pending && <div className="flex flex-col items-start gap-3"><p className="text-sm text-muted-foreground">PDF reading supports digital PDFs and clear scans, up to 25 pages and 12 MB. It uses your AI reading credits.</p><Button variant="outline" onClick={read}>Try reading again</Button></div>}
        {reading && <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{rows.length} extracted items · {selected.length} selected</p><Button asChild size="sm" variant="outline"><a href={attachmentUrl(id, messageId, partId, true)} target="_blank" rel="noopener noreferrer">Compare with original PDF<ExternalLink data-icon="inline-end" /></a></Button></div>
          {reading.extraction.warnings.length > 0 && <div className="rounded-md border bg-muted/30 p-3"><p className="text-sm font-medium">Check these details</p><ul className="mt-1 list-disc pl-5 text-sm leading-6 text-muted-foreground">{reading.extraction.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field><FieldLabel htmlFor={`pdf-po-${reading.id}`}>PO / reference number</FieldLabel><Input id={`pdf-po-${reading.id}`} maxLength={100} value={poNumber} onChange={event => { setPoNumber(event.target.value); setReviewed(false); }} /></Field>
            <Field><FieldLabel htmlFor={`pdf-date-${reading.id}`}>PO date</FieldLabel><Input id={`pdf-date-${reading.id}`} type="date" value={poDate} onChange={event => { setPoDate(event.target.value); setReviewed(false); }} /></Field>
            <Field><FieldLabel htmlFor={`pdf-buyer-${reading.id}`}>Buyer from PDF</FieldLabel><Input id={`pdf-buyer-${reading.id}`} maxLength={500} value={buyerName} onChange={event => { setBuyerName(event.target.value); setReviewed(false); }} /></Field>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Currency: {reading.extraction.currency || "not stated—confirm INR below"}. Existing customer matches are kept; verify the customer on the order. Catalog links use exact, unambiguous SKU/type matches. Other lines remain editable custom items.</p>
          {foreignCurrency && <p role="alert" className="text-sm text-destructive">This PDF uses {reading.extraction.currency}. Automatic filling currently supports INR orders. Enter this order manually.</p>}
          <div className="max-h-[45dvh] overflow-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted"><tr><th className="w-12 p-3 text-left"><Checkbox aria-label="Select all PDF items" checked={selected.length === rows.length ? true : selected.length ? "indeterminate" : false} onCheckedChange={checked => { setRows(previous => previous.map(row => ({ ...row, included: checked === true }))); setReviewed(false); }} /></th><th className="min-w-72 p-3 text-left font-medium">Item and source</th><th className="w-24 p-3 text-left font-medium">Quantity</th><th className="w-24 p-3 text-left font-medium">Unit</th><th className="w-36 p-3 text-left font-medium">Unit price · INR</th></tr></thead>
              <tbody className="divide-y">{rows.map((row, index) => <tr key={index} className={!row.included ? "opacity-60" : undefined}>
                <td className="p-3 align-top"><Checkbox aria-label={`Include item ${index + 1}`} checked={row.included} onCheckedChange={checked => updateRow(index, { included: checked === true })} /></td>
                <td className="p-3 align-top"><Input aria-label={`Item ${index + 1} title`} value={row.title} maxLength={500} onChange={event => updateRow(index, { title: event.target.value })} /><div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline">Page {row.page}</Badge>{row.needsReview && <Badge variant="secondary">Check source</Badge>}</div><details className="mt-2"><summary className="cursor-pointer text-xs text-muted-foreground">Source, specification and product codes</summary><div className="mt-2 flex flex-col gap-2"><blockquote className="border-l-2 pl-3 text-xs leading-5 text-muted-foreground">{row.evidence || "No supporting text was returned. Check the original PDF."}</blockquote><Textarea aria-label={`Item ${index + 1} description`} rows={2} value={row.description || ""} maxLength={3000} onChange={event => updateRow(index, { description: event.target.value })} placeholder="Specification" /><div className="grid grid-cols-3 gap-2"><Input aria-label={`Item ${index + 1} SKU`} placeholder="SKU" value={row.sku || ""} maxLength={150} onChange={event => updateRow(index, { sku: event.target.value })} /><Input aria-label={`Item ${index + 1} type number`} placeholder="Type number" value={row.typeNumber || ""} maxLength={150} onChange={event => updateRow(index, { typeNumber: event.target.value })} /><Input aria-label={`Item ${index + 1} HSN`} placeholder="HSN" value={row.hsnCode || ""} maxLength={30} onChange={event => updateRow(index, { hsnCode: event.target.value })} /></div></div></details></td>
                <td className="p-3 align-top"><Input aria-label={`Item ${index + 1} quantity`} type="number" min={1} step={1} value={row.quantityInput} onChange={event => updateRow(index, { quantityInput: event.target.value })} placeholder="Required" className="tabular-nums" /></td>
                <td className="p-3 align-top"><Input aria-label={`Item ${index + 1} unit`} value={row.unit || ""} maxLength={50} onChange={event => updateRow(index, { unit: event.target.value })} /></td>
                <td className="p-3 align-top"><Input aria-label={`Item ${index + 1} unit price in INR`} type="number" min={0} step="0.01" value={row.priceInput} onChange={event => updateRow(index, { priceInput: event.target.value })} placeholder="Required" className="tabular-nums" /></td>
              </tr>)}</tbody>
            </table>
          </div>
          {invalidRows > 0 && <p className="text-sm text-destructive">Enter a title, positive whole quantity and unit price for {invalidRows} selected item{invalidRows === 1 ? "" : "s"}. Missing prices are left blank.</p>}
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-6"><Checkbox className="mt-1" checked={reviewed} onCheckedChange={checked => setReviewed(checked === true)} /><span>I checked the selected rows against the PDF and confirm these unit prices are in INR.</span></label>
          <DialogFooter><p className="mr-auto text-xs leading-5 text-muted-foreground">A filled draft stays editable. Existing items in other drafts are preserved.</p><Button onClick={fill} disabled={pending || !reviewed || !selected.length || invalidRows > 0 || foreignCurrency}>{pending && <Loader2 className="animate-spin" data-icon="inline-start" />}Fill order draft ({selected.length} items)</Button></DialogFooter>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
