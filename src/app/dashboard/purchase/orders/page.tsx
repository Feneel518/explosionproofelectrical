import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import { PurchaseOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
const money = (value: unknown) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams; const q = typeof params.q === "string" ? params.q.trim() : ""; const status = typeof params.status === "string" ? params.status : "";
  const where = { ...(status && Object.values(PurchaseOrderStatus).includes(status as PurchaseOrderStatus) ? { status: status as PurchaseOrderStatus } : {}), ...(q ? { OR: [{ supplierName: { contains: q, mode: "insensitive" as const } }, { sentTo: { contains: q, mode: "insensitive" as const } }, ...(!Number.isNaN(Number(q)) ? [{ poNo: Number(q) }] : [])] } : {}) };
  const orders = await prisma.purchaseOrder.findMany({ where, orderBy: [{ orderDate: "desc" }, { poNo: "desc" }], take: 100, select: { id: true, poNo: true, poFy: true, status: true, orderDate: true, expectedDate: true, supplierName: true, grandTotal: true, sentAt: true, _count: { select: { items: true, goodsReceiptNotes: true } } } });
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Purchase Orders</h1><p className="text-sm text-muted-foreground">Create, send, and receive vendor material orders.</p></div><Button asChild><Link href="/dashboard/purchase/orders/new"><Plus className="mr-2 h-4 w-4"/>New purchase order</Link></Button></div>
    <form className="flex flex-wrap gap-2"><Input className="max-w-sm" name="q" defaultValue={q} placeholder="Search supplier or PO number"/><select name="status" defaultValue={status} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="FINALIZED">Finalized</option><option value="SENT">Sent</option><option value="CANCELLED">Cancelled</option></select><Button type="submit" variant="outline">Filter</Button></form>
    <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>PO Number</TableHead><TableHead>Supplier</TableHead><TableHead>Order date</TableHead><TableHead>Expected</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{orders.length ? orders.map((order) => <TableRow key={order.id}><TableCell><Link className="font-medium text-primary hover:underline" href={`/dashboard/purchase/orders/${order.id}`}>{formatFinancialDocumentNumber(order.poFy, order.poNo)}</Link></TableCell><TableCell>{order.supplierName}</TableCell><TableCell>{order.orderDate.toLocaleDateString("en-IN")}</TableCell><TableCell>{order.expectedDate?.toLocaleDateString("en-IN") ?? "-"}</TableCell><TableCell>{order._count.items}{order._count.goodsReceiptNotes ? ` · ${order._count.goodsReceiptNotes} GRN` : ""}</TableCell><TableCell><Badge variant={order.status === "CANCELLED" ? "destructive" : order.status === "DRAFT" ? "secondary" : "default"}>{order.status.replaceAll("_", " ")}</Badge></TableCell><TableCell className="text-right font-medium">{money(order.grandTotal)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">No purchase orders found.</TableCell></TableRow>}</TableBody></Table></div>
  </div>;
}
