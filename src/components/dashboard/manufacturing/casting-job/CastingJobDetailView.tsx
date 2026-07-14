"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { closeCastingJobAction } from "@/lib/actions/dashboard/manufacturing/casting-job/closeCastingJobAction";
import { postCastingJobReceiptAction } from "@/lib/actions/dashboard/manufacturing/casting-job/postCastingJobReceiptAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatWeight(value?: number | null) {
  return `${Number(value || 0).toFixed(3)} kg`;
}

function statusVariant(status: string) {
  switch (status) {
    case "CLOSED":
      return "default";
    case "PARTIAL_RECEIVED":
      return "outline";
    case "IN_PROGRESS":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function workerTypeLabel(value?: string | null) {
  switch (value) {
    case "JOB_WORK":
      return "Job Work";
    case "CONTRACT":
      return "Contract";
    case "IN_HOUSE":
    default:
      return "In House";
  }
}

type ReceiptRowInput = {
  receivedQty: number;
  receivedWeightKg: number;
};

export default function CastingJobDetailView({ castingJob }: { castingJob: any }) {
  const router = useRouter();
  const [isPosting, startPosting] = React.useTransition();
  const [isClosing, startClosing] = React.useTransition();

  const [receivedAt, setReceivedAt] = React.useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [receivedByName, setReceivedByName] = React.useState<string>("");
  const [receiptRemarks, setReceiptRemarks] = React.useState<string>("");
  const [rows, setRows] = React.useState<Record<string, ReceiptRowInput>>(() => {
    const initial: Record<string, ReceiptRowInput> = {};
    for (const item of castingJob.items ?? []) {
      initial[item.id] = { receivedQty: 0, receivedWeightKg: 0 };
    }
    return initial;
  });

  const documentNo = formatFinancialDocumentNumber(castingJob.jobFy, castingJob.jobNo);
  const canPostReceipt =
    castingJob.status === "IN_PROGRESS" || castingJob.status === "PARTIAL_RECEIVED";

  const onUpdateRow = (
    itemId: string,
    key: keyof ReceiptRowInput,
    value: number,
  ) => {
    setRows((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? { receivedQty: 0, receivedWeightKg: 0 }),
        [key]: value,
      },
    }));
  };

  const onPostReceipt = () => {
    const payloadItems = (castingJob.items ?? [])
      .map((item: any) => ({
        castingJobItemId: item.id,
        receivedQty: Number(rows[item.id]?.receivedQty || 0),
        receivedWeightKg: Number(rows[item.id]?.receivedWeightKg || 0),
      }))
      .filter(
        (item: any) => Number(item.receivedQty || 0) > 0 || Number(item.receivedWeightKg || 0) > 0,
      );

    if (!payloadItems.length) {
      toast.error("Enter at least one receipt item.");
      return;
    }

    startPosting(async () => {
      const res = await postCastingJobReceiptAction({
        castingJobId: castingJob.id,
        receivedAt: receivedAt ? new Date(receivedAt).toISOString() : null,
        receivedByName,
        remarks: receiptRemarks,
        items: payloadItems,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.refresh();
    });
  };

  const onCloseJob = () => {
    startClosing(async () => {
      const res = await closeCastingJobAction(castingJob.id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{documentNo}</h1>
          <p className="text-sm text-muted-foreground">
            Worker: {castingJob.workerNameSnapshot} ({workerTypeLabel(castingJob.workerType)})
          </p>
        </div>
        <Badge variant={statusVariant(castingJob.status) as any}>{castingJob.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Info label="Job Number" value={documentNo} />
          <Info label="Issue Date" value={formatDate(castingJob.issueDate)} />
          <Info label="Expected Return" value={formatDate(castingJob.expectedReturnDate)} />
          <Info label="Worker Type" value={workerTypeLabel(castingJob.workerType)} />
          <Info label="Supplier" value={castingJob.supplier?.companyName || "-"} />
          <Info label="Remarks" value={castingJob.remarks || "-"} className="md:col-span-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issued vs Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(castingJob.items ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            (castingJob.items ?? []).map((item: any, index: number) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="font-medium">
                  #{index + 1} {item.inputTitle} {"->"} {item.outputTitle}
                </div>
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-4">
                  <InfoInline
                    label="Issued"
                    value={`${item.issuedQty} / ${formatWeight(item.issuedWeightKg)}`}
                  />
                  <InfoInline
                    label="Received"
                    value={`${item.receivedQty} / ${formatWeight(item.receivedWeightKg)}`}
                  />
                  <InfoInline
                    label="Jalan / Pending Weight"
                    value={formatWeight(item.pendingWeightKg)}
                  />
                  <InfoInline
                    label="Expected"
                    value={`${item.expectedOutputQty ?? 0} / ${formatWeight(item.expectedOutputWeightKg)}`}
                  />
                </div>
              </div>
            ))
          )}

          <div className="grid gap-3 rounded-xl border p-3 md:grid-cols-3">
            <InfoInline
              label="Total Issued"
              value={`${castingJob.totalIssuedQty} / ${formatWeight(castingJob.totalIssuedWeightKg)}`}
            />
            <InfoInline
              label="Total Received"
              value={`${castingJob.totalReceivedQty} / ${formatWeight(castingJob.totalReceivedWeightKg)}`}
            />
            <InfoInline
              label="Jalan / Yield"
              value={`${formatWeight(castingJob.totalPendingWeightKg)} / ${Number(castingJob.yieldPercent || 0).toFixed(2)}%`}
            />
          </div>
        </CardContent>
      </Card>

      {canPostReceipt ? (
        <Card>
          <CardHeader>
            <CardTitle>Post Receipt</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posting receipt adds stock only to the selected casting output. Issued aluminum
              is not auto-restocked.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm">Received At</label>
                <Input
                  type="datetime-local"
                  value={receivedAt}
                  onChange={(event) => setReceivedAt(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Received By</label>
                <Input
                  value={receivedByName}
                  onChange={(event) => setReceivedByName(event.target.value)}
                  placeholder="Receiver name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Remarks</label>
                <Input
                  value={receiptRemarks}
                  onChange={(event) => setReceiptRemarks(event.target.value)}
                  placeholder="Optional remarks"
                />
              </div>
            </div>

            <div className="space-y-3">
              {(castingJob.items ?? []).map((item: any, index: number) => (
                <div key={item.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-4">
                  <div>
                    <div className="text-sm font-medium">#{index + 1} {item.outputTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      Pending: {formatWeight(item.pendingWeightKg)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Receive Qty</label>
                    <Input
                      type="number"
                      min={0}
                      value={rows[item.id]?.receivedQty ?? 0}
                      onChange={(event) =>
                        onUpdateRow(
                          item.id,
                          "receivedQty",
                          Math.max(0, Number(event.target.value || 0)),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Receive Weight (Kg)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.001"
                      value={rows[item.id]?.receivedWeightKg ?? 0}
                      onChange={(event) =>
                        onUpdateRow(
                          item.id,
                          "receivedWeightKg",
                          Math.max(0, Number(event.target.value || 0)),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setRows((prev) => ({
                          ...prev,
                          [item.id]: { receivedQty: 0, receivedWeightKg: 0 },
                        }))
                      }
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" onClick={onPostReceipt} disabled={isPosting}>
                {isPosting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Receipt"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onCloseJob} disabled={isClosing}>
                {isClosing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing...
                  </>
                ) : (
                  "Close Job"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Receipt History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(castingJob.receipts ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No receipt entries yet.
            </div>
          ) : (
            (castingJob.receipts ?? []).map((receipt: any) => (
              <div key={receipt.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">Receipt #{receipt.receiptNo}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(receipt.receivedAt)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Received By: {receipt.receivedByNameSnapshot || "-"}
                </div>
                {receipt.remarks ? (
                  <div className="text-xs text-muted-foreground">Remarks: {receipt.remarks}</div>
                ) : null}
                <div className="mt-2 space-y-1">
                  {(receipt.items ?? []).map((entry: any) => (
                    <div key={entry.id} className="text-sm">
                      {entry.castingJobItem?.outputTitle || "Item"}: {entry.receivedQty} / {formatWeight(entry.receivedWeightKg)}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/dashboard/manufacturing/casting-jobs"
          className="text-sm hover:underline"
        >
          Back to casting jobs
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
