"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SupplierCombobox } from "@/components/dashboard/global/SupplierCombobox";
import { RawMaterialCombobox } from "@/components/dashboard/global/RawMaterialCombobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePurchaseOrderAction } from "@/lib/actions/dashboard/purchase/order/purchaseOrderActions";
import { emptyPurchaseOrderDraft, type PurchaseOrderDraft } from "@/lib/types/PurchaseOrderTypes";

const n = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const dateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

export default function PurchaseOrderForm({ orderId, initialDraft, documentNumber }: { orderId?: string; initialDraft?: PurchaseOrderDraft; documentNumber?: string }) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<PurchaseOrderDraft>(initialDraft ?? emptyPurchaseOrderDraft());
  const [saving, setSaving] = React.useState(false);
  const update = <K extends keyof PurchaseOrderDraft>(key: K, value: PurchaseOrderDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));
  const updateItem = (index: number, patch: Partial<PurchaseOrderDraft["items"][number]>) => setDraft((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const totals = React.useMemo(() => {
    let subtotal = 0, discount = 0, taxable = 0, gst = 0;
    for (const item of draft.items) { const gross = n(item.qty) * n(item.unitPrice); const disc = gross * n(item.discountPercent) / 100; const taxBase = gross - disc; subtotal += gross; discount += disc; taxable += taxBase; gst += taxBase * n(item.gstPercent) / 100; }
    return { subtotal: round2(subtotal), discount: round2(discount), taxable: round2(taxable), gst: round2(gst), grand: round2(taxable + gst + n(draft.shippingAmount)) };
  }, [draft]);

  async function submit(finalize: boolean) {
    setSaving(true);
    const result = await savePurchaseOrderAction({ id: orderId, draft, finalize });
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    toast.success(finalize ? "Purchase order finalized" : "Draft saved");
    router.push(finalize ? `/dashboard/purchase/orders/${result.id}` : `/dashboard/purchase/orders/${result.id}/edit`);
    router.refresh();
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">{orderId ? `Edit Purchase Order ${documentNumber ?? ""}` : "New Purchase Order"}</h1><p className="text-sm text-muted-foreground">Order raw materials from a supplier with agreed pricing and terms.</p></div><div className="flex gap-2"><Button variant="outline" disabled={saving} onClick={() => submit(false)}><Save className="mr-2 h-4 w-4"/>Save draft</Button><Button disabled={saving} onClick={() => submit(true)}><Send className="mr-2 h-4 w-4"/>Finalize</Button></div></div>
    <Card><CardHeader><CardTitle>Supplier & delivery</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2"><Label>Supplier *</Label><SupplierCombobox value={draft.supplierId} onChange={(value) => update("supplierId", value ?? "")} /></div>
      <div className="space-y-2"><Label>Order date *</Label><Input type="date" value={dateInput(draft.orderDate)} onChange={(e) => update("orderDate", new Date(`${e.target.value}T00:00:00`).toISOString())}/></div>
      <div className="space-y-2"><Label>Expected delivery</Label><Input type="date" value={dateInput(draft.expectedDate)} onChange={(e) => update("expectedDate", e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : null)}/></div>
      <div className="space-y-2"><Label>Payment terms</Label><Input value={draft.paymentTerms ?? ""} onChange={(e) => update("paymentTerms", e.target.value)}/></div>
      <div className="space-y-2"><Label>Delivery terms</Label><Input value={draft.deliveryTerms ?? ""} onChange={(e) => update("deliveryTerms", e.target.value)}/></div>
      <div className="space-y-2"><Label>Freight / shipping</Label><Input type="number" min="0" step="0.01" value={draft.shippingAmount} onChange={(e) => update("shippingAmount", n(e.target.value))}/></div>
      <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Ship to</Label><Textarea value={draft.shippingAddress ?? ""} onChange={(e) => update("shippingAddress", e.target.value)}/></div>
    </CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Materials</CardTitle><Button type="button" size="sm" onClick={() => update("items", [...draft.items, { id: crypto.randomUUID(), rawMaterialId: null, title: "", supplierItemName: "", itemCode: "", hsnCode: "", unit: "Nos", qty: 1, unitPrice: 0, discountPercent: 0, gstPercent: 18, remarks: "" }])}><Plus className="mr-2 h-4 w-4"/>Add material</Button></CardHeader><CardContent>
      {!draft.items.length ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No materials added yet.</div> : <div className="space-y-4">{draft.items.map((item, index) => { const gross = n(item.qty) * n(item.unitPrice); const taxable = gross * (1 - n(item.discountPercent) / 100); const total = taxable * (1 + n(item.gstPercent) / 100); return <div key={item.id} className="rounded-lg border p-4"><div className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4"><Label>Material *</Label><RawMaterialCombobox value={item.rawMaterialId} onChange={(material) => material && updateItem(index, { rawMaterialId: material.id, title: material.companyItemName || material.title, supplierItemName: material.supplierItemName, itemCode: material.itemCode, hsnCode: material.hsnCode, unit: material.unit })}/></div>
        <div className="space-y-2 lg:col-span-2"><Label>Quantity *</Label><Input type="number" min="0.001" step="0.001" value={item.qty} onChange={(e) => updateItem(index, { qty: n(e.target.value) })}/></div>
        <div className="space-y-2 lg:col-span-2"><Label>Unit price</Label><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: n(e.target.value) })}/></div>
        <div className="space-y-2 lg:col-span-1"><Label>Disc. %</Label><Input type="number" min="0" max="100" value={item.discountPercent} onChange={(e) => updateItem(index, { discountPercent: n(e.target.value) })}/></div>
        <div className="space-y-2 lg:col-span-1"><Label>GST %</Label><Input type="number" min="0" max="100" value={item.gstPercent} onChange={(e) => updateItem(index, { gstPercent: n(e.target.value) })}/></div>
        <div className="space-y-2 lg:col-span-1"><Label>Total</Label><div className="pt-2 text-sm font-semibold">{money(round2(total))}</div></div>
        <div className="flex items-end lg:col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => update("items", draft.items.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
        <div className="space-y-2 lg:col-span-12"><Label>Line remarks</Label><Input value={item.remarks ?? ""} onChange={(e) => updateItem(index, { remarks: e.target.value })}/></div>
      </div></div>; })}</div>}
    </CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>Notes & terms</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Remarks</Label><Textarea value={draft.remarks ?? ""} onChange={(e) => update("remarks", e.target.value)}/></div><div className="space-y-2"><Label>Terms and conditions</Label><Textarea rows={4} value={draft.terms ?? ""} onChange={(e) => update("terms", e.target.value)}/></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Order total</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>- {money(totals.discount)}</span></div><div className="flex justify-between"><span>Taxable</span><span>{money(totals.taxable)}</span></div><div className="flex justify-between"><span>GST</span><span>{money(totals.gst)}</span></div><div className="flex justify-between"><span>Freight</span><span>{money(n(draft.shippingAmount))}</span></div><div className="flex justify-between border-t pt-3 text-lg font-semibold"><span>Grand total</span><span>{money(totals.grand)}</span></div></CardContent></Card></div>
  </div>;
}
