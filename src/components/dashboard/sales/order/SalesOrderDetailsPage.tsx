"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FC } from "react";
import { ArrowLeft, FileText, Pencil, ReceiptText, Truck } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { reopenSalesOrderAsDraftAction } from "@/lib/actions/dashboard/sales/order/reopenSalesOrderAsDraftAction";
import { GetSalesOrderByIdData } from "@/lib/types/SalesOrderTypes";
import PdfPreviewCard from "../../global/PDFPreviewCard";
import WorkOrderCopyModal from "@/components/customerCopy/sales-order/WorkOrderCopyDialog";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import type { ClientSafe } from "@/lib/helpers/server/serializeForClient";
import { getSalesOrderStatusBadge } from "@/lib/helpers/dashboard/sales/orderStatusBadge";

interface SalesOrderDetailsPageProps {
  order: ClientSafe<GetSalesOrderByIdData>;
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatCurrency(value?: number | string | null) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function getInvoiceStatusVariant(status: string) {
  switch (status) {
    case "FINALIZED":
    case "PAID":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "DRAFT":
    default:
      return "secondary";
  }
}

const SalesOrderDetailsPage: FC<SalesOrderDetailsPageProps> = ({ order }) => {
  console.log(order.poFile.length > 0);

  const router = useRouter();
  const orderLabel = formatFinancialDocumentNumber(
    order.orderFy,
    order.orderNo,
  );
  const statusBadge = getSalesOrderStatusBadge(order.status);

  const clientName =
    order.clientNameSnapshot ||
    order.clientName ||
    order.customer?.companyName ||
    order.receivedFromName ||
    "-";

  const canEdit = order.status === "DRAFT" || order.status === "CONFIRMED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-2">
          <Link
            href="/dashboard/sales/orders"
            className={cn(buttonVariants({ variant: "ghost" }), "px-0")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="wrap-break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {orderLabel}
            </h1>

            <Badge
              variant={statusBadge.variant}
              className={statusBadge.className}>
              {order.status}
            </Badge>

            <Badge variant="outline">{order.sourceType}</Badge>
          </div>

          <p className="max-w-2xl text-sm text-muted-foreground">
            View sales order details, execution progress, linked quotation, and
            item summary.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap xl:justify-end">
          {canEdit ? (
            <Button
              onClick={async () => {
                if (status === "DRAFT") {
                  router.push(`/dashboard/sales/orders/${order.id}/edit`);
                  return;
                }

                const res = await reopenSalesOrderAsDraftAction(order.id);

                if (!res.ok) {
                  toast.error(res.message);
                  return;
                }

                toast.success("Order reopened");
                router.push(`/dashboard/sales/orders/${order.id}/edit`);
              }}
              className={buttonVariants({ variant: "outline" })}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : null}

          <WorkOrderCopyModal
            orderId={order.id}
            items={order.items.map((item, index) => ({
              id: item.id,
              productName: item.product?.name,
              itemName: item.variant?.variant,
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              price: Number(item.unitPrice),
            }))}
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {formatCurrency(Number(order.grandTotal))}
            </div>
            <p className="text-xs text-muted-foreground">
              Subtotal {formatCurrency(Number(order.subtotal))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ordered Qty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {order.totalOrderedQty}
            </div>
            <p className="text-xs text-muted-foreground">
              {order.totalItemsCount} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Dispatched Qty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {order.totalDispatchedQty}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending {order.totalPendingQty}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invoiced Qty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {order.totalInvoicedQty}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmed on {formatDate(order.confirmedAt || order.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main layout */}
      <div className="grid gap-6 2xl:grid-cols-12">
        <div className="space-y-6 2xl:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Info label="Order No" value={orderLabel} />
              <Info label="Status" value={order.status} />
              <Info label="Source Type" value={order.sourceType} />
              <Info label="Order Date" value={formatDate(order.orderDate)} />
              <Info label="PO Number" value={order.poNumber || "-"} />
              <Info label="PO Date" value={formatDate(order.poDate)} />
              <Info label="Client" value={clientName} />
              <Info
                label="Customer Linked"
                value={order.customer ? "Yes" : "No"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commercial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Info label="GST" value={order.gst} />
              <Info label="Packing Charges" value={order.packingCharges} />
              <Info
                label="Transportation Payment"
                value={order.transportationPayment}
              />
              <Info label="Payment Terms" value={order.paymentTerms} />
              <Info label="Delivery Date" value={order.deliveryDate || "-"} />
              <Info label="Discount" value={order.discount || "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-xl border lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[280px] text-white">
                        Item
                      </TableHead>
                      <TableHead className="text-white">Qty</TableHead>
                      <TableHead className="text-white">Unit Price</TableHead>
                      <TableHead className="text-white">Dispatched</TableHead>
                      <TableHead className="text-white">Invoiced</TableHead>
                      <TableHead className="text-white">Pending</TableHead>
                      <TableHead className="text-right text-white">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-sm text-muted-foreground">
                          No items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      order.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="align-top">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.typeNumber || item.sku || "-"}
                            </div>
                            {item.description ? (
                              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell>{item.dispatchedQty}</TableCell>
                          <TableCell>{item.invoicedQty}</TableCell>
                          <TableCell>{item.pendingQty}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              item.lineGrandTotal || item.lineSubtotal,
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile + tablet cards */}
              <div className="space-y-3 lg:hidden">
                {order.items.length === 0 ? (
                  <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
                    No items found.
                  </div>
                ) : (
                  order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="rounded-xl border p-4 space-y-3">
                      <div className="min-w-0">
                        <div className="wrap-break-words font-medium">
                          {item.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.typeNumber || item.sku || "-"}
                        </div>
                        {item.description ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <InfoInline label="Qty" value={item.qty} />
                        <InfoInline
                          label="Unit Price"
                          value={formatCurrency(item.unitPrice)}
                        />
                        <InfoInline
                          label="Dispatched"
                          value={item.dispatchedQty}
                        />
                        <InfoInline label="Invoiced" value={item.invoicedQty} />
                        <InfoInline label="Pending" value={item.pendingQty} />
                        <InfoInline
                          label="Amount"
                          value={formatCurrency(
                            item.lineGrandTotal || item.lineSubtotal,
                          )}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrapwrap-break-words text-sm text-muted-foreground">
                {order.additionalNotes || "No notes added."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              <Info label="Created At" value={formatDate(order.createdAt)} />
              <Info
                label="Confirmed At"
                value={formatDate(order.confirmedAt)}
              />
              <Info
                label="Production Started"
                value={formatDate(order.productionStartedAt)}
              />
              <Info
                label="First Dispatch"
                value={formatDate(order.firstDispatchAt)}
              />
              <Info
                label="Fully Dispatched"
                value={formatDate(order.fullyDispatchedAt)}
              />
              <Info
                label="First Invoiced"
                value={formatDate(order.firstInvoicedAt)}
              />
              <Info
                label="Fully Invoiced"
                value={formatDate(order.fullyInvoicedAt)}
              />
              <Info
                label="Completed At"
                value={formatDate(order.completedAt)}
              />
              <Info
                label="Cancelled At"
                value={formatDate(order.cancelledAt)}
              />
            </CardContent>
          </Card>

          {order.poFile.length > 0 && (
            <div className="space-y-4">
              {order.poFile.map((file: any) => (
                <PdfPreviewCard
                  key={file.id}
                  url={file.url}
                  title={file.title}
                />
              ))}
            </div>
          )}

          {/* <PdfPreviewCard url={order.poFile[0].url}></PdfPreviewCard> */}
        </div>

        <div className="space-y-6 2xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Linked Quotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.quotation ? (
                <>
                  <div className="text-sm">
                    <span className="font-medium wrap-break-words">
                      {formatFinancialDocumentNumber(
                        order.quotation.quoteFy,
                        order.quotation.quoteNo,
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {order.quotation.status}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(order.quotation.createdAt)}
                  </div>
                  <Link
                    href={`/dashboard/sales/quotations/${order.quotation.id}`}
                    className={buttonVariants({ variant: "outline" })}>
                    <ReceiptText className="mr-2 h-4 w-4" />
                    View Quotation
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quotation linked.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <Info
                label="Client Name"
                value={order.clientNameSnapshot || "-"}
              />
              <Info label="City" value={order.citySnapshot || "-"} />
              <Info label="State" value={order.stateSnapshot || "-"} />
              <Info label="GSTIN" value={order.gstinSnapshot || "-"} />
              <Info label="Phone" value={order.receivedFromPhone || "-"} />
              <Info label="Email" value={order.receivedFromEmail || "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Challans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.deliveryChallans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No delivery challans linked yet.
                </p>
              ) : (
                order.deliveryChallans.map((challan: any) => (
                  <Link
                    key={challan.id}
                    href={`/dashboard/sales/delivery-challans/${challan.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40">
                    <div className="min-w-0">
                      <div className="font-medium wrap-break-words">
                        {formatFinancialDocumentNumber(
                          challan.challanFy,
                          challan.challanNo,
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(challan.createdAt)}
                      </div>
                    </div>
                    <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked Invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No invoices linked yet.
                </p>
              ) : (
                order.invoices.map((invoice: any) => (
                  <Link
                    key={invoice.id}
                    href={`/dashboard/sales/invoices/${invoice.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40">
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium wrap-break-words">
                        {formatFinancialDocumentNumber(
                          invoice.invoiceFy,
                          invoice.invoiceNo,
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(invoice.createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(Number(invoice.grandTotal ?? 0))}
                      </div>
                    </div>
                    <Badge
                      variant={getInvoiceStatusVariant(invoice.status) as any}>
                      {invoice.status}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailsPage;

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="wrap-break-words font-medium">{value}</div>
    </div>
  );
}

function InfoInline({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="wrap-break-words font-medium">{value}</div>
    </div>
  );
}
