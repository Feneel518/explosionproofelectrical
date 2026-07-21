"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reopenDeliveryChallanAsDraftAction } from "@/lib/actions/dashboard/sales/delivery-challan/reopenDeliveryChallanAsDraftAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";

type DeliveryChallanItemView = {
  id: string;
  kind: string;
  productVariantId: string | null;
  title: string;
  sku: string | null;
  typeNumber: string | null;
  description: string | null;
  hsnCode: string | null;
  unit: string | null;
  qty: number;
  closedQty: number;
  pendingQty: number;
  sortOrder: number;
};

type DeliveryChallanView = {
  id: string;
  challanNo: number;
  challanFy: string;
  challanCode: string;

  status: string;
  type: string;
  partyType: string;

  date: Date | string;
  issuedAt: Date | string | null;
  closedAt: Date | string | null;
  cancelledAt?: Date | string | null;

  expectedReturnDate: Date | string | null;
  expectedClosureDate: Date | string | null;

  poNumber: string | null;

  quotationId: string | null;
  quotation?: {
    id: string;
    quoteNo: number;
    quoteFy: string;
    clientName: string | null;
  } | null;

  customerId: string | null;
  customer?: {
    id: string;
    companyName: string;
    gstin?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
  } | null;

  transporterName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  dispatchThrough: string | null;
  lrNumber: string | null;
  numberOfPackages: number | null;
  remarks: string | null;
  closureRemarks: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  items: DeliveryChallanItemView[];
};

type Props = {
  deliveryChallan: DeliveryChallanView;
};

function fmtDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusVariant(status: string) {
  switch (status) {
    case "ISSUED":
      return "outline";
    case "PARTIALLY_CLOSED":
      return "secondary";
    case "CLOSED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function typeVariant(type: string) {
  switch (type) {
    case "TO_BE_BILLED":
      return "default";
    case "JOB_WORK":
      return "secondary";
    case "SAMPLE":
      return "outline";
    case "RETURNABLE":
      return "default";
    default:
      return "secondary";
  }
}

export default function DeliveryChallanDetailView({ deliveryChallan }: Props) {
  const router = useRouter();

  const clientName =
    deliveryChallan.customer?.companyName ||
    deliveryChallan.quotation?.clientName ||
    "Unnamed Party";

  const totalQty = deliveryChallan.items.reduce(
    (acc, item) => acc + Number(item.qty || 0),
    0,
  );

  const totalClosedQty = deliveryChallan.items.reduce(
    (acc, item) => acc + Number(item.closedQty || 0),
    0,
  );

  const totalPendingQty = deliveryChallan.items.reduce(
    (acc, item) => acc + Number(item.pendingQty || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Top Summary */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">
              {formatFinancialDocumentNumber(
                deliveryChallan.challanFy,
                deliveryChallan.challanNo,
              )}
            </CardTitle>
            <p className="text-muted-foreground">{clientName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={typeVariant(deliveryChallan.type) as any}>
              {deliveryChallan.type}
            </Badge>

            <Badge variant={statusVariant(deliveryChallan.status) as any}>
              {deliveryChallan.status}
            </Badge>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const res = await reopenDeliveryChallanAsDraftAction(
                  deliveryChallan.id,
                );
                if (!res.ok) {
                  toast.error(res.message);
                  return;
                }
                router.push(
                  `/dashboard/sales/delivery-challans/${deliveryChallan.id}/edit`,
                );
              }}>
              Edit Challan
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Party Type</div>
            <div className="font-medium">{deliveryChallan.partyType}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Challan Date</div>
            <div className="font-medium">{fmtDate(deliveryChallan.date)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Issued At</div>
            <div className="font-medium">
              {fmtDate(deliveryChallan.issuedAt)}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Closed At</div>
            <div className="font-medium">
              {fmtDate(deliveryChallan.closedAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Party / Link Details */}
      <Card>
        <CardHeader>
          <CardTitle>Party & Reference Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium">
              {deliveryChallan.customer?.companyName || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">GSTIN</div>
            <div className="font-medium">
              {deliveryChallan.customer?.gstin || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">PO Number</div>
            <div className="font-medium">{deliveryChallan.poNumber || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Linked Quotation
            </div>
            <div className="font-medium">
              {deliveryChallan.quotation
                ? formatFinancialDocumentNumber(
                    deliveryChallan.quotation.quoteFy,
                    deliveryChallan.quotation.quoteNo,
                  )
                : "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Expected Return Date
            </div>
            <div className="font-medium">
              {fmtDate(deliveryChallan.expectedReturnDate)}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Expected Closure Date
            </div>
            <div className="font-medium">
              {fmtDate(deliveryChallan.expectedClosureDate)}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="whitespace-pre-wrap rounded-lg border p-3 text-sm">
              {[
                deliveryChallan.customer?.addressLine1,
                deliveryChallan.customer?.addressLine2,
                [
                  deliveryChallan.customer?.city,
                  deliveryChallan.customer?.state,
                  deliveryChallan.customer?.country,
                ]
                  .filter(Boolean)
                  .join(", "),
                deliveryChallan.customer?.pincode,
              ]
                .filter(Boolean)
                .join("\n") || "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transport & Dispatch Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">
              Transporter Name
            </div>
            <div className="font-medium">
              {deliveryChallan.transporterName || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Vehicle Number</div>
            <div className="font-medium">
              {deliveryChallan.vehicleNumber || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">
              Dispatch Through
            </div>
            <div className="font-medium">
              {deliveryChallan.dispatchThrough || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Driver Name</div>
            <div className="font-medium">
              {deliveryChallan.driverName || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Driver Phone</div>
            <div className="font-medium">
              {deliveryChallan.driverPhone || "-"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">LR Number</div>
            <div className="font-medium">{deliveryChallan.lrNumber || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Packages</div>
            <div className="font-medium">
              {deliveryChallan.numberOfPackages ?? "-"}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">Remarks</div>
            <div className="whitespace-pre-wrap rounded-lg border p-3 text-sm">
              {deliveryChallan.remarks || "-"}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-muted-foreground">Closure Remarks</div>
            <div className="whitespace-pre-wrap rounded-lg border p-3 text-sm">
              {deliveryChallan.closureRemarks || "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Challan Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryChallan.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            deliveryChallan.items
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item, index) => (
                <div key={item.id} className="space-y-4 rounded-2xl border p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Item #{index + 1}
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {[item.sku, item.typeNumber]
                          .filter(Boolean)
                          .join("   ") || "-"}
                      </div>
                    </div>

                    <Badge variant="outline">{item.kind}</Badge>
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

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                        Closed Qty
                      </div>
                      <div className="font-medium">{item.closedQty}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        Pending Qty
                      </div>
                      <div className="font-medium">{item.pendingQty}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        HSN Code
                      </div>
                      <div className="font-medium">{item.hsnCode || "-"}</div>
                    </div>
                  </div>
                </div>
              ))
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
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">
                {deliveryChallan.items.length}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Quantity</span>
              <span className="font-medium">{totalQty}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Closed Quantity</span>
              <span className="font-medium">{totalClosedQty}</span>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-base">
              <span className="font-semibold">Pending Quantity</span>
              <span className="font-bold">{totalPendingQty}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
