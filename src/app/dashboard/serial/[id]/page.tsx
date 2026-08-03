import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

function Value({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{children || "—"}</div>
    </div>
  );
}

export default async function SerialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const serial = await prisma.productSerial.findUnique({
    where: { id },
    select: {
      id: true,
      serialNumber: true,
      status: true,
      year: true,
      sequence: true,
      batchId: true,
      createdAt: true,
      updatedAt: true,
      invoicedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          serialPrefix: true,
          hsnCode: true,
          category: { select: { name: true } },
        },
      },
      invoiceItem: {
        select: {
          id: true,
          title: true,
          sku: true,
          typeNumber: true,
          description: true,
          hsnCode: true,
          qty: true,
          unit: true,
          unitPrice: true,
          variant: { select: { variant: true, rating: true } },
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              invoiceFy: true,
              status: true,
              invoiceDate: true,
              poNumber: true,
              clientNameSnapshot: true,
              citySnapshot: true,
              stateSnapshot: true,
              gstinSnapshot: true,
              dispatchDate: true,
              transporterName: true,
              vehicleNumber: true,
              dispatchThrough: true,
              lrNumber: true,
              salesOrder: { select: { id: true, orderNo: true, orderFy: true } },
              customer: {
                select: {
                  id: true,
                  companyName: true,
                  companyEmail: true,
                  companyPhone: true,
                  addressLine1: true,
                  addressLine2: true,
                  city: true,
                  state: true,
                  country: true,
                  pincode: true,
                  gstin: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!serial) notFound();
  const item = serial.invoiceItem;
  const invoice = item?.invoice;
  const customer = invoice?.customer;
  const customerName = customer?.companyName ?? invoice?.clientNameSnapshot ?? "—";
  const customerAddress = customer
    ? [customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.pincode, customer.country].filter(Boolean).join(", ")
    : [invoice?.citySnapshot, invoice?.stateSnapshot].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="-ml-3"><Link href="/dashboard/serial"><ArrowLeft className="mr-2 size-4" /> Serial register</Link></Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold">{serial.serialNumber}</h1>
            <Badge variant={serial.status === "AVAILABLE" ? "secondary" : serial.status === "VOID" ? "destructive" : "default"}>{serial.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Complete manufacturing and sales traceability for this unit.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/dashboard/serial/print/${serial.batchId}`} target="_blank"><Printer className="mr-2 size-4" /> Print batch</Link></Button>
          {invoice ? <Button asChild><Link href={`/dashboard/sales/invoices/${invoice.id}`}><FileText className="mr-2 size-4" /> Open invoice</Link></Button> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Serial information</CardTitle></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Value label="Serial number"><span className="font-mono">{serial.serialNumber}</span></Value>
            <Value label="Status">{serial.status}</Value>
            <Value label="Manufacturing year">{serial.year}</Value>
            <Value label="Sequence">{serial.sequence}</Value>
            <Value label="Generated on">{format(serial.createdAt, "dd MMM yyyy, hh:mm a")}</Value>
            <Value label="Invoiced on">{serial.invoicedAt ? format(serial.invoicedAt, "dd MMM yyyy, hh:mm a") : "—"}</Value>
            <Value label="Batch ID"><span className="break-all font-mono text-xs">{serial.batchId}</span></Value>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Product information</CardTitle></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Value label="Product">{serial.product.name}</Value>
            <Value label="Product code">{serial.product.serialPrefix ?? "—"}</Value>
            <Value label="Category">{serial.product.category.name}</Value>
            <Value label="Variant">{item?.variant?.variant ?? "—"}</Value>
            <Value label="Rating">{item?.variant?.rating ?? "—"}</Value>
            <Value label="SKU">{item?.sku ?? "—"}</Value>
            <Value label="Type number">{item?.typeNumber ?? "—"}</Value>
            <Value label="HSN code">{item?.hsnCode ?? serial.product.hsnCode ?? "—"}</Value>
          </CardContent>
        </Card>
      </div>

      {invoice && item ? (
        <>
          <Card>
            <CardHeader><CardTitle>Invoice assignment</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Value label="Invoice number"><Link className="text-primary hover:underline" href={`/dashboard/sales/invoices/${invoice.id}`}>{formatFinancialDocumentNumber(invoice.invoiceFy, invoice.invoiceNo)}</Link></Value>
              <Value label="Invoice status">{invoice.status}</Value>
              <Value label="Invoice date">{format(invoice.invoiceDate, "dd MMM yyyy")}</Value>
              <Value label="Invoice item">{item.title}</Value>
              <Value label="Invoice item quantity">{item.qty} {item.unit ?? "Nos"}</Value>
              <Value label="Unit price">₹{Number(item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Value>
              <Value label="PO number">{invoice.poNumber ?? "—"}</Value>
              <Value label="Sales order">{invoice.salesOrder ? <Link className="text-primary hover:underline" href={`/dashboard/sales/orders/${invoice.salesOrder.id}`}>{formatFinancialDocumentNumber(invoice.salesOrder.orderFy, invoice.salesOrder.orderNo)}</Link> : "—"}</Value>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Value label="Company">{customerName}</Value>
              <Value label="Phone">{customer?.companyPhone ?? "—"}</Value>
              <Value label="Email">{customer?.companyEmail ?? "—"}</Value>
              <Value label="GSTIN">{customer?.gstin ?? invoice.gstinSnapshot ?? "—"}</Value>
              <Value label="Address"><span className="font-normal">{customerAddress || "—"}</span></Value>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dispatch</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Value label="Dispatch date">{invoice.dispatchDate ? format(invoice.dispatchDate, "dd MMM yyyy") : "—"}</Value>
              <Value label="Transporter">{invoice.transporterName ?? "—"}</Value>
              <Value label="Dispatch through">{invoice.dispatchThrough ?? "—"}</Value>
              <Value label="Vehicle number">{invoice.vehicleNumber ?? "—"}</Value>
              <Value label="LR number">{invoice.lrNumber ?? "—"}</Value>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardHeader><CardTitle>Sales assignment</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">This serial is available and has not been assigned to a finalized invoice.</CardContent></Card>
      )}
    </div>
  );
}
