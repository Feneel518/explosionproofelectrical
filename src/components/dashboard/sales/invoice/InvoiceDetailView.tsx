"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { reopenInvoiceAsDraftAction } from "@/lib/actions/dashboard/sales/invoice/reopenInvoiceAsDraftAction";
import PdfPreviewCard from "../../global/PDFPreviewCard";
import InvoicePackingStickerDialog from "@/components/customerCopy/invoice/InvoicePackingStickerDialog";
import InvoiceTestCertificateDialog from "@/components/customerCopy/invoice/InvoiceTestCertificateDialog";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

type Props = {
  invoice: any;
};

function fmtDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function fmtMoney(value?: number | string | null) {
  const n = Number(value ?? 0);
  return `₹${n.toFixed(2)}`;
}

function statusVariant(status: string) {
  switch (status) {
    case "FINALIZED":
    case "ISSUED":
    case "PAID":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "PARTIAL":
      return "outline";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function getPackingRows(packing: unknown): Array<{
  boxNumber?: string | null;
  quantity?: number | null;
  notes?: string | null;
}> {
  if (!Array.isArray(packing)) return [];
  return packing as Array<{
    boxNumber?: string | null;
    quantity?: number | null;
    notes?: string | null;
  }>;
}

export default function InvoiceDetailView({ invoice }: Props) {
  const router = useRouter();

  const clientName =
    invoice.clientNameSnapshot ||
    formatFinancialDocumentNumber(
      invoice.salesOrder.orderFy,
      invoice.salesOrder.orderNo,
    );
  const printableItems = (invoice.items ?? []).map((item: any) => ({
    id: item.id,
    title: item.title ?? "Item",
    sku: item.sku ?? null,
    typeNumber: item.typeNumber ?? null,
    qty: Number(item.invoiceQty ?? 0),
    unit: item.unit ?? null,
  }));
  const printablePackages = (invoice.packages ?? []).map((pkg: any) => ({
    id: pkg.id,
    packageNo: pkg.packageNo,
    packageType: pkg.packageType ?? null,
    label: pkg.label ?? null,
    remarks: pkg.remarks ?? null,
    grossWeight: pkg.grossWeight ?? null,
    netWeight: pkg.netWeight ?? null,
    items: Array.isArray(pkg.items)
      ? pkg.items.map((pkgItem: any) => ({
          id: pkgItem.id,
          qty: Number(pkgItem.qty ?? 0),
          title: pkgItem.title ?? null,
          sku: pkgItem.sku ?? null,
          typeNumber: pkgItem.typeNumber ?? null,
        }))
      : [],
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {formatFinancialDocumentNumber(
                  invoice.invoiceFy,
                  invoice.invoiceNo,
                )}
              </CardTitle>
              <p className="text-muted-foreground">{clientName}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span>Invoice Amount : {fmtMoney(invoice.grandTotal)}</span>

              <Badge variant={statusVariant(invoice.status) as any}>
                {invoice.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={`/invoices/${invoice.id}/view`}>Customer Copy</Link>
            </Button>

            <InvoicePackingStickerDialog
              invoiceId={invoice.id}
              packages={printablePackages}
            />

            <InvoiceTestCertificateDialog
              invoiceId={invoice.id}
              items={printableItems}
            />

            {invoice.status === "DRAFT" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/sales/invoices/${invoice.id}/edit`)
                }>
                Edit Invoice
              </Button>
            ) : invoice.status === "FINALIZED" ? (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const res = await reopenInvoiceAsDraftAction(invoice.id);
                  if (!res.ok) {
                    toast.error(res.message);
                    return;
                  }
                  toast.success(res.message);
                  router.push(`/dashboard/sales/invoices/${invoice.id}/edit`);
                }}>
                Reopen For Edit
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Invoice Date</div>
            <div className="font-medium">{fmtDate(invoice.invoiceDate)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Dispatch Date</div>
            <div className="font-medium">{fmtDate(invoice.dispatchDate)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Sales Order</div>
            <div className="font-medium">
              {formatFinancialDocumentNumber(
                invoice.salesOrder.orderFy,
                invoice.salesOrder.orderNo,
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">PO Number</div>
            <div className="font-medium">
              {invoice.poNumber || invoice.salesOrder.poNumber || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client & Billing Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Client Name</div>
            <div className="font-medium">
              {invoice.clientNameSnapshot || "—"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">City</div>
            <div className="font-medium">{invoice.citySnapshot || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">State</div>
            <div className="font-medium">{invoice.stateSnapshot || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">GSTIN</div>
            <div className="font-medium">{invoice.gstinSnapshot || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">PO Date</div>
            <div className="font-medium">{fmtDate(invoice.poDate)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Remarks</div>
            <div className="font-medium">{invoice.remarks || "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispatch Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">
              Transporter Name
            </div>
            <div className="font-medium">{invoice.transporterName || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Dispatch Through
            </div>
            <div className="font-medium">{invoice.dispatchThrough || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Vehicle Number</div>
            <div className="font-medium">{invoice.vehicleNumber || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Driver Name</div>
            <div className="font-medium">{invoice.driverName || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Driver Phone</div>
            <div className="font-medium">{invoice.driverPhone || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">LR Number</div>
            <div className="font-medium">{invoice.lrNumber || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">E-Way Bill</div>
            <div className="font-medium">{invoice.ewayBill || "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            invoice.items.map((item: any, index: number) => {
              const packingRows = getPackingRows(item.packing);

              return (
                <div key={item.id} className="space-y-4 rounded-2xl border p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Item #{index + 1}
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {[
                          item.sku,
                          item.typeNumber,
                          item.cimfrNumber,
                          item.serialNumber,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Line Total
                      </div>
                      <div className="text-xl font-bold">
                        {fmtMoney(item.lineTotal)}
                      </div>
                    </div>
                  </div>

                  {item.description ? (
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Description
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {item.description}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Invoice Qty
                      </div>
                      <div className="font-medium">{item.invoiceQty}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Dispatched Qty
                      </div>
                      <div className="font-medium">{item.dispatchedQty}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Unit</div>
                      <div className="font-medium">{item.unit || "—"}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Unit Price
                      </div>
                      <div className="font-medium">
                        {fmtMoney(item.unitPrice)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        HSN Code
                      </div>
                      <div className="font-medium">{item.hsnCode || "—"}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Type Number
                      </div>
                      <div className="font-medium">
                        {item.typeNumber || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        CIMFR Number
                      </div>
                      <div className="font-medium">
                        {item.cimfrNumber || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Serial Number
                      </div>
                      <div className="font-medium">
                        {item.serialNumber || "—"}
                      </div>
                    </div>
                  </div>

                  {packingRows.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Packing</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {packingRows.map((box, boxIndex) => (
                          <div
                            key={`${item.id}-packing-${boxIndex}`}
                            className="rounded-xl border bg-muted/30 p-3">
                            <div className="text-sm font-medium">
                              Box: {box.boxNumber || `#${boxIndex + 1}`}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Qty: {box.quantity ?? "—"}
                            </div>
                            {box.notes ? (
                              <div className="mt-1 text-sm text-muted-foreground">
                                Notes: {box.notes}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {item.photos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Delivered Item Photos
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {item.photos.map((img: any) => (
                          <a
                            key={img.id}
                            href={img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-xl border bg-background">
                            <div className="relative size-40 overflow-hidden bg-white p-2">
                              <Image
                                src={img.url}
                                alt={img.title ?? item.title ?? "Item Photo"}
                                fill
                                className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                              />
                            </div>
                            <div className="truncate border-t px-3 py-2 text-xs text-muted-foreground">
                              {img.title ||
                                item.title ||
                                "Delivered item photo"}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Packaging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!Array.isArray(invoice.packages) || invoice.packages.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No packaging details available.
            </div>
          ) : (
            invoice.packages.map((pkg: any, index: number) => (
              <div key={pkg.id ?? index} className="rounded-xl border p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="font-medium">Package #{pkg.packageNo || index + 1}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {pkg.packageType || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Label: {pkg.label || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gross: {pkg.grossWeight ?? "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Net: {pkg.netWeight ?? "—"}
                  </div>
                </div>

                {pkg.remarks ? (
                  <div className="text-sm text-muted-foreground">{pkg.remarks}</div>
                ) : null}

                {Array.isArray(pkg.items) && pkg.items.length > 0 ? (
                  <div className="space-y-1">
                    {pkg.items.map((pkgItem: any) => (
                      <div
                        key={pkgItem.id}
                        className="text-sm text-muted-foreground">
                        {pkgItem.qty} x {pkgItem.title || "Item"}
                        {pkgItem.sku ? ` (${pkgItem.sku})` : ""}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No items in this package.</div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LR Copy</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.lrCopy.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No LR copy uploaded.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {invoice.lrCopy.map((file: any) => {
                const isPdf = file.url.toLowerCase().includes(".pdf");

                if (isPdf) {
                  return (
                    <PdfPreviewCard
                      key={file.id}
                      url={file.url}
                      title={file.title || "LR Copy"}
                      height={420}
                    />
                  );
                }

                return (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border bg-background">
                    <div className="relative h-72 w-full overflow-hidden bg-white">
                      <Image
                        src={file.url}
                        alt={file.title || "LR Copy"}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="truncate border-t px-3 py-2 text-xs text-muted-foreground">
                      {file.title || "LR Copy"}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmtMoney(invoice.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="font-medium">{fmtMoney(invoice.gstTotal)}</span>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-base">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold">{fmtMoney(invoice.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
