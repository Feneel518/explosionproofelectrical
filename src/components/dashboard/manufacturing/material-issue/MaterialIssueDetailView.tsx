"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function MaterialIssueDetailView({ issue }: { issue: any }) {
  const documentNo = formatFinancialDocumentNumber(issue.issueFy, issue.issueNo);
  const issueType = issue.issueType === "DIRECT_SALE" ? "Direct Sale" : "Internal Use";
  const issuedToLabel =
    issue.issueType === "DIRECT_SALE" ? "Customer Name" : "Issued To";
  const totalIssued = (issue.items ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.qtyIssued || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{documentNo}</h1>
          <p className="text-sm text-muted-foreground">
            {issuedToLabel}: {issue.issuedToNameSnapshot}
          </p>
        </div>
        <Badge variant={issue.status === "FINALIZED" ? "default" : "secondary"}>
          {issue.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Info label="Issue Number" value={documentNo} />
          <Info label="Issue Date" value={formatDate(issue.issueDate)} />
          <Info label="Issue Type" value={issueType} />
          <Info label={issuedToLabel} value={issue.issuedToNameSnapshot || "-"} />
          <Info label="Issued By" value={issue.issuedByNameSnapshot || "-"} />
          <Info
            label="Sale Reference"
            value={issue.directSaleReferenceNo || "-"}
          />
          <Info
            label="Department"
            value={issue.issueType === "DIRECT_SALE" ? "-" : issue.department || "-"}
          />
          <Info label="Purpose" value={issue.purpose || "-"} />
          <Info
            label="Work Reference"
            value={issue.workReference || "-"}
            className="md:col-span-3"
          />
          <Info label="Remarks" value={issue.remarks || "-"} className="md:col-span-3" />
          <Info label="Total Items" value={String(issue.items.length)} />
          <Info label="Total Quantity Issued" value={String(totalIssued)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issued Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {issue.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items found.
            </div>
          ) : (
            issue.items.map((item: any, index: number) => (
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
                  <InfoInline label="Issued" value={item.qtyIssued} />
                  <InfoInline label="Returned" value={item.qtyReturned} />
                  <InfoInline label="Pending" value={item.qtyIssued - item.qtyReturned} />
                  <InfoInline label="Unit" value={item.unit || "-"} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/dashboard/manufacturing/material-issues"
          className="text-sm hover:underline">
          Back to material issue list
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
