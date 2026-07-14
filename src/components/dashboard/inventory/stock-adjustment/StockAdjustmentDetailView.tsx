import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { STOCK_ADJUSTMENT_MOVEMENT_LABELS } from "@/lib/helpers/inventory/stockAdjustment";

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value?: any) {
  if (value == null) return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function StockAdjustmentDetailView({ adjustment }: { adjustment: any }) {
  const documentNo = formatFinancialDocumentNumber(
    adjustment.adjustFy,
    adjustment.adjustNo,
  );

  const totalIn = (adjustment.items ?? []).reduce((sum: number, item: any) => {
    const movement = String(item.movementType || "");
    return ["ADJUST_IN", "RETURN_IN", "IN"].includes(movement)
      ? sum + Number(item.qty || 0)
      : sum;
  }, 0);

  const totalOut = (adjustment.items ?? []).reduce((sum: number, item: any) => {
    const movement = String(item.movementType || "");
    return ["ADJUST_OUT", "SCRAP_OUT", "RETURN_OUT", "OUT"].includes(movement)
      ? sum + Number(item.qty || 0)
      : sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{documentNo}</h1>
          <p className="text-sm text-muted-foreground">
            Adjusted By: {adjustment.adjustedByNameSnapshot || "-"}
          </p>
        </div>
        <Badge variant={adjustment.status === "FINALIZED" ? "default" : "secondary"}>
          {adjustment.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Info label="Adjustment Number" value={documentNo} />
          <Info label="Adjustment Date" value={formatDate(adjustment.adjustDate)} />
          <Info label="Adjusted By" value={adjustment.adjustedByNameSnapshot || "-"} />
          <Info label="Reason" value={adjustment.reason || "-"} className="md:col-span-2" />
          <Info label="Remarks" value={adjustment.remarks || "-"} className="md:col-span-3" />
          <Info label="Total Lines" value={String(adjustment.items.length)} />
          <Info label="Total In Qty" value={String(totalIn)} />
          <Info label="Total Out Qty" value={String(totalOut)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjusted Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adjustment.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            adjustment.items.map((item: any, index: number) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      #{index + 1} {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[item.sku, item.typeNumber, item.hsnCode, item.unit]
                        .filter(Boolean)
                        .join(" • ") || "-"}
                    </div>
                  </div>
                  <Badge variant={["ADJUST_IN", "RETURN_IN", "IN"].includes(item.movementType) ? "default" : "secondary"}>
                    {STOCK_ADJUSTMENT_MOVEMENT_LABELS[
                      item.movementType as keyof typeof STOCK_ADJUSTMENT_MOVEMENT_LABELS
                    ] || item.movementType}
                  </Badge>
                </div>

                <div className="mt-2 grid gap-2 text-sm md:grid-cols-4">
                  <InfoInline label="Item Type" value={item.rawMaterialId ? "Raw Material" : "Finished Good"} />
                  <InfoInline label="Quantity" value={item.qty} />
                  <InfoInline label="Unit Cost" value={formatMoney(item.unitCost)} />
                  <InfoInline
                    label="Line Total"
                    value={
                      item.unitCost == null
                        ? "-"
                        : formatMoney(Number(item.unitCost) * Number(item.qty || 0))
                    }
                  />
                </div>

                {item.remarks ? (
                  <div className="mt-2 text-xs text-muted-foreground">{item.remarks}</div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/dashboard/inventory/adjustments"
          className="text-sm hover:underline">
          Back to stock adjustments
        </Link>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function InfoInline({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
