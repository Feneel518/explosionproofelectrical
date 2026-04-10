"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuotationFollowupsSection from "./QuotationFollowupsSection";
import { reopenQuotationAsDraftAction } from "@/lib/actions/dashboard/sales/quotation/reopenQuotationAsDraftAction";
import { createDraftSalesOrderAction } from "@/lib/actions/dashboard/sales/order/createDraftSalesOrderAction";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import { GetQuotationByIdData } from "@/lib/types/QuotationTypes";
import Image from "next/image";
import PdfPreviewCard from "../../global/PDFPreviewCard";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { Loader2 } from "lucide-react";

type Props = {
  quotation: GetQuotationByIdData;
};

function fmtDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function fmtMoney(value?: number | string | null) {
  const n = Number(value ?? 0);
  return formatCurrencyINR(n);
}

function statusVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "EXPIRED":
      return "secondary";
    case "SENT":
      return "outline";
    case "CONVERTED":
      return "default";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function getItemSpecs(item: any) {
  return [
    { label: "Rating", value: item.rating },
    { label: "Terminals", value: item.terminals },
    { label: "Hardware", value: item.hardware },
    { label: "Gasket", value: item.gasket },
    { label: "Mounting", value: item.mounting },
    { label: "Cable Entry", value: item.cableEntry },
    { label: "Earthing", value: item.earthing },
    { label: "HSN Code", value: item.hsnCode },
    { label: "Cutout Size", value: item.cutoutSize },
    { label: "Plate Size", value: item.plateSize },
    { label: "Glass", value: item.glass },
    { label: "Wire Guard", value: item.wireGuard },
    { label: "Variant Type", value: item.variantType },
    { label: "Size", value: item.size },
    { label: "RPM", value: item.rpm },
    {
      label: "kW / HP",
      value: [item.kW, item.horsePower].filter(Boolean).join(" / "),
    },
    { label: "PO Reference", value: item.poReference },
  ].filter((spec) => {
    if (spec.value == null) return false;
    if (typeof spec.value === "string" && spec.value.trim() === "")
      return false;
    return true;
  });
}

function getSelectedImages(item: GetQuotationByIdData["items"][number]) {
  const allImages =
    (item.variantImagesSnapshot as {
      id: string;
      url: string | null;
      title: string | null;
    }[]) ?? [];
  const selectedIds = item.selectedVariantImageIds ?? [];
  console.log(allImages);

  if (!item.showVariantImages) return [];

  if (!selectedIds.length) return allImages;

  return allImages.filter((img) => selectedIds.includes(img.id));
}

function getSelectedDrawings(item: GetQuotationByIdData["items"][number]) {
  const allDrawings =
    (item.variantDrawingsSnapshot as {
      id: string;
      url: string | null;
      title: string | null;
    }[]) ?? [];
  const selectedIds = item.selectedVariantDrawingIds ?? [];

  if (!item.showVariantDrawings) return [];

  if (!selectedIds.length) return allDrawings;

  return allDrawings.filter((drawing: any) => selectedIds.includes(drawing.id));
}

export default function QuotationDetailView({ quotation }: Props) {
  const router = useRouter();
  const [isConvertingToOrder, setIsConvertingToOrder] = React.useState(false);
  const clientName =
    quotation.customer?.companyName ||
    quotation.clientName ||
    quotation.receivedFromName ||
    "Unnamed Client";
  const canConvertToOrder =
    !quotation.convertedToOrderAt &&
    quotation.status !== "LOST" &&
    quotation.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Top Summary */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">
              {formatFinancialDocumentNumber(
                quotation.quoteFy,
                quotation.quoteNo,
              )}
            </CardTitle>
            <p className="text-muted-foreground">{clientName}</p>
          </div>

          <span className="">
            Quotation Amount : {fmtMoney(quotation.subtotal)}
          </span>

          <Badge variant={statusVariant(quotation.status) as any}>
            {quotation.status}
          </Badge>

          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const res = await reopenQuotationAsDraftAction(quotation.id);
              if (!res.ok) {
                toast.error(res.message);
                return;
              }
              router.push(`/dashboard/sales/quotations/${quotation.id}/edit`);
            }}>
            Edit Quotation
          </Button>

          {canConvertToOrder ? (
            <Button
              type="button"
              disabled={isConvertingToOrder}
              onClick={async () => {
                setIsConvertingToOrder(true);
                try {
                  const res = await createDraftSalesOrderAction(quotation.id);
                  if (!res.ok) {
                    toast.error(res.message);
                    return;
                  }
                  router.push(`/dashboard/sales/orders/${res.id}/edit`);
                } finally {
                  setIsConvertingToOrder(false);
                }
              }}>
              {isConvertingToOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Convert to Order"
              )}
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Platform</div>
            <div className="font-medium">{quotation.platform}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Created At</div>
            <div className="font-medium">{fmtDate(quotation.createdAt)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Next Follow-up</div>
            <div className="font-medium">
              {fmtDate(quotation.nextFollowupAt)}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Last Follow-up</div>
            <div className="font-medium">
              {fmtDate(quotation.lastFollowupAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client / Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Client & Enquiry Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium">
              {quotation.customer?.companyName || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Client Name</div>
            <div className="font-medium">{quotation.clientName || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">GSTIN</div>
            <div className="font-medium">
              {quotation.customer?.gstin || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Received From Name
            </div>
            <div className="font-medium">
              {quotation.receivedFromName || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="font-medium">
              {quotation.receivedFromPhone || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium break-all">
              {quotation.receivedFromEmail || "-"}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">Enquiry Message</div>
            <div className="whitespace-pre-wrap rounded-lg border p-3 text-sm">
              {quotation.enquiryMessage || "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quotation Terms & Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">GST</div>
            <div className="font-medium">{quotation.gst || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Packing Charges</div>
            <div className="font-medium">{quotation.packingCharges || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Payment Terms</div>
            <div className="font-medium">{quotation.paymentTerms || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Transportation Payment
            </div>
            <div className="font-medium">
              {quotation.transportationPayment || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Delivery Date</div>
            <div className="font-medium">
              {quotation.deliveryDate
                ? typeof quotation.deliveryDate === "string"
                  ? quotation.deliveryDate
                  : fmtDate(quotation.deliveryDate)
                : "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Discount</div>
            <div className="font-medium">{quotation.discount || "-"}</div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">
              Additional Notes
            </div>
            <div className="whitespace-pre-wrap rounded-lg border p-3 text-sm">
              {quotation.additionalNotes || "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Quotation Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quotation.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            quotation.items.map((item, index) => {
              const selectedImages = getSelectedImages(item);
              const selectedDrawings = getSelectedDrawings(item);
              return (
                <div key={item.id} className="rounded-2xl border p-5 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Item #{index + 1}
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {[item.sku, item.typeNumber]
                          .filter(Boolean)
                          .join(" â€¢ ") || "-"}
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
                      <div className="text-xs text-muted-foreground">Qty</div>
                      <div className="font-medium">{item.qty}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Unit</div>
                      <div className="font-medium">{item.unit || "-"}</div>
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
                        PO Reference
                      </div>
                      <div className="font-medium">
                        {item.poReference || "-"}
                      </div>
                    </div>
                  </div>

                  {getItemSpecs(item).length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-4">
                      {getItemSpecs(item).map((spec) => (
                        <div key={spec.label}>
                          <div className="text-xs text-muted-foreground">
                            {spec.label}
                          </div>
                          <div className="font-medium">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 text-sm font-medium">Components</div>
                    {item.component?.length ? (
                      <div>
                        <div className="mb-2 text-sm font-medium">
                          Components
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {item.component
                            .filter((comp) => comp.item?.trim())
                            .map((comp: any) => (
                              <div
                                key={comp.id}
                                className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                                <span className="font-medium">{comp.item}</span>
                                {comp.unit ? (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    â€¢ {comp.unit}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {(selectedImages.length > 0 ||
                    selectedDrawings.length > 0) && (
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Attachments</div>

                      {selectedImages.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Product Images
                          </div>
                          <div className="flex items-center">
                            {selectedImages.map((img: any) => (
                              <a
                                key={img.id}
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group overflow-hidden rounded-xl border bg-background flex flex-col items-center justify-center">
                                <div className=" relative size-40  overflow-hidden bg-white p-2">
                                  <Image
                                    src={img.url}
                                    alt={
                                      img.title ?? item.title ?? "Product Image"
                                    }
                                    fill
                                    className=" object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                  />
                                </div>
                                <div className="border-t px-3 py-2 text-xs text-muted-foreground truncate">
                                  {img.alt || item.title || "Product image"}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDrawings.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Technical Drawings
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedDrawings.map((drawing) => (
                              <PdfPreviewCard
                                key={drawing.id}
                                url={drawing.url!}
                                title={drawing.title || "Technical Drawing"}
                                height={420}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {fmtMoney(quotation.subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">{quotation.discount || "-"}</span>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-base">
              <span className="font-semibold">Quotation Value</span>
              <span className="font-bold">{fmtMoney(quotation.subtotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups */}
      <QuotationFollowupsSection
        quotationId={quotation.id}
        followups={quotation.followups}
        nextFollowupAt={quotation.nextFollowupAt}
      />
    </div>
  );
}
