import Link from "next/link";
import { Plus } from "lucide-react";
import { PurchaseOrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const where = {
    ...(status && Object.values(PurchaseOrderStatus).includes(status as PurchaseOrderStatus)
      ? { status: status as PurchaseOrderStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { supplierName: { contains: q, mode: "insensitive" as const } },
            { sentTo: { contains: q, mode: "insensitive" as const } },
            ...(!Number.isNaN(Number(q)) ? [{ poNo: Number(q) }] : []),
          ],
        }
      : {}),
  };
  const orders = await prisma.purchaseOrder.findMany({
    where,
    orderBy: [{ orderDate: "desc" }, { poNo: "desc" }],
    take: 100,
    select: {
      id: true,
      poNo: true,
      poFy: true,
      status: true,
      orderDate: true,
      expectedDate: true,
      supplierName: true,
      supplierEmail: true,
      paymentTerms: true,
      grandTotal: true,
      sentAt: true,
      _count: { select: { items: true, goodsReceiptNotes: true } },
    },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Create, send, and receive vendor material orders.</p>
        </div>
        <Button asChild><Link href="/dashboard/purchase/orders/new"><Plus className="mr-2 h-4 w-4" />New purchase order</Link></Button>
      </div>
      <form className="flex flex-wrap gap-2">
        <Input className="max-w-sm" name="q" defaultValue={q} placeholder="Search supplier or PO number" />
        <select name="status" defaultValue={status} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FINALIZED">Finalized</option>
          <option value="SENT">Sent</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order date</TableHead>
              <TableHead>Expected delivery</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Items / receipts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Order total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length ? orders.map((order) => {
              const overdue = Boolean(
                order.expectedDate &&
                order.expectedDate < today &&
                order.status !== "CANCELLED" &&
                order._count.goodsReceiptNotes === 0,
              );
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link className="font-medium text-primary hover:underline" href={`/dashboard/purchase/orders/${order.id}`}>
                      {formatFinancialDocumentNumber(order.poFy, order.poNo)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.supplierName}</div>
                    {order.supplierEmail && <div className="text-xs text-muted-foreground">{order.supplierEmail}</div>}
                  </TableCell>
                  <TableCell>{order.orderDate.toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <div className={overdue ? "font-medium text-destructive" : ""}>
                      {order.expectedDate?.toLocaleDateString("en-IN") ?? "-"}
                    </div>
                    {overdue && <div className="text-xs text-destructive">Overdue</div>}
                  </TableCell>
                  <TableCell>{order.paymentTerms || "-"}</TableCell>
                  <TableCell>
                    <div>{order._count.items} item{order._count.items === 1 ? "" : "s"}</div>
                    <div className="text-xs text-muted-foreground">{order._count.goodsReceiptNotes} GRN</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status === "CANCELLED" ? "destructive" : order.status === "DRAFT" ? "secondary" : "default"}>
                      {order.status.replaceAll("_", " ")}
                    </Badge>
                    {order.sentAt && <div className="mt-1 text-xs text-muted-foreground">Sent {order.sentAt.toLocaleDateString("en-IN")}</div>}
                  </TableCell>
                  <TableCell className="text-right font-medium">{money(order.grandTotal)}</TableCell>
                </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={8} className="h-28 text-center text-muted-foreground">No purchase orders found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
