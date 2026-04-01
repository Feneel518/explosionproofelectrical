"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateGrnPostCheckAction } from "@/lib/actions/dashboard/purchase/grn/updateGrnPostCheckAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value?: number | string | null) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

type InvoiceFile = {
  url: string;
  title: string | null;
};

type MaterialCheckStatus = "PENDING" | "CHECKED_OK" | "CHECKED_NOT_OK";
type QuantityCheckStatus = "PENDING" | "OK" | "MISMATCH";
type DiscrepancyAction =
  | "HOLD_STOCK"
  | "RETURN_TO_SUPPLIER"
  | "REQUEST_REPLACEMENT"
  | "ADJUST_STOCK"
  | "ACCEPT_WITH_DEVIATION";

const ACTION_HINTS: Record<DiscrepancyAction, string> = {
  HOLD_STOCK: "Keep received material in quarantine. Do not issue to production.",
  RETURN_TO_SUPPLIER: "Arrange return challan and reverse the received quantity.",
  REQUEST_REPLACEMENT: "Keep disputed stock separately and request replacement from supplier.",
  ADJUST_STOCK: "Post inventory adjustment after physical verification and approval.",
  ACCEPT_WITH_DEVIATION: "Accept material with note and approval from responsible person.",
};

function parseInvoiceFiles(value: unknown): InvoiceFile[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((file) => {
      if (!file || typeof file !== "object") return null;
      const row = file as { url?: unknown; title?: unknown };
      if (typeof row.url !== "string" || !row.url.trim()) return null;
      return {
        url: row.url.trim(),
        title: typeof row.title === "string" ? row.title : null,
      };
    })
    .filter((file): file is InvoiceFile => Boolean(file));
}

function toMaterialLabel(status: MaterialCheckStatus) {
  switch (status) {
    case "CHECKED_OK":
      return "Material OK";
    case "CHECKED_NOT_OK":
      return "Material Not OK";
    default:
      return "Material Pending";
  }
}

function toQuantityLabel(status: QuantityCheckStatus) {
  switch (status) {
    case "OK":
      return "Quantity OK";
    case "MISMATCH":
      return "Quantity Mismatch";
    default:
      return "Quantity Pending";
  }
}

export default function GrnDetailView({ grn }: { grn: any }) {
  const documentNo = formatFinancialDocumentNumber(grn.grnFy, grn.grnNo);
  const totalValue = (grn.items ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.lineTotal ?? 0),
    0,
  );
  const invoiceFiles = parseInvoiceFiles(grn.supplierInvoiceFiles);
  const transportationPaid = Boolean(grn.transportationPaid);

  const [materialCheckStatus, setMaterialCheckStatus] =
    React.useState<MaterialCheckStatus>(grn.materialCheckStatus ?? "PENDING");
  const [quantityCheckStatus, setQuantityCheckStatus] =
    React.useState<QuantityCheckStatus>(grn.quantityCheckStatus ?? "PENDING");
  const [discrepancyAction, setDiscrepancyAction] = React.useState<
    DiscrepancyAction | ""
  >(grn.discrepancyAction ?? "");
  const [checkNotes, setCheckNotes] = React.useState<string>(grn.checkNotes ?? "");
  const [isSavingPostCheck, setIsSavingPostCheck] = React.useState(false);
  const [checkedAt, setCheckedAt] = React.useState<string | null>(
    grn.checkedAt ? new Date(grn.checkedAt).toISOString() : null,
  );

  const hasIssue =
    materialCheckStatus === "CHECKED_NOT_OK" || quantityCheckStatus === "MISMATCH";

  const savePostCheck = async () => {
    setIsSavingPostCheck(true);
    try {
      const res = await updateGrnPostCheckAction({
        grnId: grn.id,
        materialCheckStatus,
        quantityCheckStatus,
        discrepancyAction: hasIssue
          ? ((discrepancyAction || null) as DiscrepancyAction | null)
          : null,
        checkNotes,
      });

      if (!res.ok) {
        toast.error(res.message || "Failed to update post-check status.");
        return;
      }

      setCheckedAt(res.data.checkedAt ? new Date(res.data.checkedAt).toISOString() : null);
      toast.success(res.message);
    } finally {
      setIsSavingPostCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{documentNo}</h1>
          <p className="text-sm text-muted-foreground">
            Supplier: {grn.supplierNameSnapshot || "-"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {grn.status !== "DRAFT" ? (
            <Button asChild variant="outline">
              <Link href={`/grn/${grn.id}/view`}>Customer Copy</Link>
            </Button>
          ) : null}
          <Badge variant={grn.status === "FINALIZED" ? "default" : "secondary"}>
            {grn.status}
          </Badge>
          <Badge variant={materialCheckStatus === "CHECKED_NOT_OK" ? "destructive" : "outline"}>
            {toMaterialLabel(materialCheckStatus)}
          </Badge>
          <Badge variant={quantityCheckStatus === "MISMATCH" ? "destructive" : "outline"}>
            {toQuantityLabel(quantityCheckStatus)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Info label="GRN Number" value={documentNo} />
          <Info label="Received Date" value={formatDate(grn.receivedAt)} />
          <Info label="Supplier Invoice No" value={grn.supplierInvoiceNo || "-"} />
          <Info
            label="Supplier Invoice Date"
            value={formatDate(grn.supplierInvoiceDate)}
          />
          <Info label="Status" value={grn.status} />
          <Info label="Total Items" value={String(grn.items.length)} />
          <Info label="Transporter Name" value={grn.transporterName || "-"} />
          <Info label="LR Number" value={grn.lrNumber || "-"} />
          <Info
            label="Transportation Paid"
            value={transportationPaid ? "Yes" : "No"}
          />
          <Info
            label="Transportation Amount"
            value={
              transportationPaid && grn.transportationPaidAmount
                ? formatCurrency(grn.transportationPaidAmount)
                : "-"
            }
          />
          <Info
            label="Total Value"
            value={formatCurrency(totalValue)}
            className="md:col-span-3"
          />
          <Info label="Remarks" value={grn.remarks || "-"} className="md:col-span-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post Receipt Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm">Material Check</label>
              <Select
                value={materialCheckStatus}
                onValueChange={(value) =>
                  setMaterialCheckStatus(value as MaterialCheckStatus)
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select material check status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CHECKED_OK">Checked OK</SelectItem>
                  <SelectItem value="CHECKED_NOT_OK">Checked Not OK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Quantity Check</label>
              <Select
                value={quantityCheckStatus}
                onValueChange={(value) =>
                  setQuantityCheckStatus(value as QuantityCheckStatus)
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select quantity check status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="MISMATCH">Mismatch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Action If Not OK</label>
              <Select
                value={discrepancyAction || "none"}
                onValueChange={(value) =>
                  setDiscrepancyAction(value === "none" ? "" : (value as DiscrepancyAction))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Action</SelectItem>
                  <SelectItem value="HOLD_STOCK">Hold Stock</SelectItem>
                  <SelectItem value="RETURN_TO_SUPPLIER">Return To Supplier</SelectItem>
                  <SelectItem value="REQUEST_REPLACEMENT">Request Replacement</SelectItem>
                  <SelectItem value="ADJUST_STOCK">Adjust Stock</SelectItem>
                  <SelectItem value="ACCEPT_WITH_DEVIATION">Accept With Deviation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasIssue ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {discrepancyAction
                ? ACTION_HINTS[discrepancyAction]
                : "Select an action above. For not-ok/mismatch, do not directly issue this stock to production."}
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm">Check Notes</label>
            <Textarea
              value={checkNotes}
              onChange={(event) => setCheckNotes(event.target.value)}
              placeholder="Write what was checked and any findings"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Last checked: {checkedAt ? formatDate(checkedAt) : "Not checked yet"}
            </p>
            <Button type="button" onClick={savePostCheck} disabled={isSavingPostCheck}>
              {isSavingPostCheck ? "Saving..." : "Save Post Check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Invoice Files</CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceFiles.length === 0 ? (
            <div className="text-sm text-muted-foreground">No invoice file uploaded.</div>
          ) : (
            <div className="space-y-2">
              {invoiceFiles.map((file, index) => (
                <a
                  key={`${file.url}-${index}`}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-fit text-sm font-medium text-primary hover:underline">
                  {file.title || `Invoice File ${index + 1}`}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {grn.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            grn.items.map((item: any, index: number) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="font-medium">
                  #{index + 1} {item.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  Supplier Name: {item.supplierItemName || "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {[item.sku, item.hsnCode].filter(Boolean).join(" • ") || "-"}
                </div>
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-4">
                  <InfoInline label="Qty" value={item.qty} />
                  <InfoInline label="Unit" value={item.unit || "-"} />
                  <InfoInline label="Unit Cost" value={formatCurrency(item.unitCost)} />
                  <InfoInline label="Line Total" value={formatCurrency(item.lineTotal)} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/dashboard/purchase/grn" className="text-sm hover:underline">
          Back to GRN list
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

