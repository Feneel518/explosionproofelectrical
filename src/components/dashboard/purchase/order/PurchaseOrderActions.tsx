"use client";
import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { Ban, Mail, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cancelPurchaseOrderAction, createGrnFromPurchaseOrderAction, sendPurchaseOrderAction } from "@/lib/actions/dashboard/purchase/order/purchaseOrderActions";

export default function PurchaseOrderActions({ id, status, supplierEmail }: { id: string; status: string; supplierEmail?: string | null }) {
  const router = useRouter(); const [email, setEmail] = React.useState(supplierEmail ?? ""); const [message, setMessage] = React.useState(""); const [busy, setBusy] = React.useState(false); const [open, setOpen] = React.useState(false);
  async function send() { setBusy(true); const res = await sendPurchaseOrderAction(id, email, message); setBusy(false); if (!res.ok) return toast.error(res.message); toast.success("Purchase order emailed"); setOpen(false); router.refresh(); }
  async function createGrn() { setBusy(true); const res = await createGrnFromPurchaseOrderAction(id); setBusy(false); if (!res.ok) return toast.error(res.message); toast.success("GRN draft created"); router.push(`/dashboard/purchase/grn/${res.id}/edit`); }
  async function cancel() { if (!confirm("Cancel this purchase order? This cannot be undone.")) return; setBusy(true); const res = await cancelPurchaseOrderAction(id); setBusy(false); if (!res.ok) return toast.error(res.message); toast.success("Purchase order cancelled"); router.refresh(); }
  if (status === "DRAFT") return null;
  return <div className="flex flex-wrap gap-2">{status !== "CANCELLED" && <><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Mail className="mr-2 h-4 w-4"/>{status === "SENT" ? "Send again" : "Send to vendor"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Email purchase order</DialogTitle><DialogDescription>The email includes the full order and a printable purchase-order link.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Recipient email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></div><div className="space-y-2"><Label>Message (optional)</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Please confirm acceptance and delivery date."/></div></div><DialogFooter><Button disabled={busy} onClick={send}>Send email</Button></DialogFooter></DialogContent></Dialog><Button variant="outline" disabled={busy} onClick={createGrn}><PackageCheck className="mr-2 h-4 w-4"/>Create GRN</Button><Button variant="destructive" disabled={busy} onClick={cancel}><Ban className="mr-2 h-4 w-4"/>Cancel</Button></>}</div>;
}
