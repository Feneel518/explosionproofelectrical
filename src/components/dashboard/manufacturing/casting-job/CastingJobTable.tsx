"use client";

import React from "react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  castingJobParsers,
  CastingJobQP,
} from "@/lib/searchParams/dashboard/manufacturing/casting-job/CastingJobSearchParams";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import CastingJobToolbar from "./CastingJobToolbar";
import CastingJobAction from "./CastingJobAction";
import { CastingJobStatus, CastingJobWorkerType } from "@prisma/client";

type CastingJobListItem = {
  id: string;
  jobNo: number;
  jobFy: string;
  status: CastingJobStatus;
  workerType: CastingJobWorkerType;
  workerNameSnapshot: string;
  issueDate: Date;
  expectedReturnDate: Date | null;
  totalIssuedQty: number;
  totalIssuedWeightKg: number;
  totalReceivedQty: number;
  totalReceivedWeightKg: number;
  totalPendingWeightKg: number;
  yieldPercent: number | null;
  supplier: { companyName: string } | null;
  createdAt: Date;
};

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatWeight(value: number | null | undefined) {
  return `${Number(value || 0).toFixed(3)} kg`;
}

function statusVariant(status: CastingJobStatus) {
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

function workerTypeLabel(type: CastingJobWorkerType) {
  switch (type) {
    case "JOB_WORK":
      return "Job Work";
    case "CONTRACT":
      return "Contract";
    case "IN_HOUSE":
    default:
      return "In House";
  }
}

export default function CastingJobTable({
  items,
  total,
  page,
  pageSize,
  qp,
}: {
  items: CastingJobListItem[];
  total: number;
  page: number;
  pageSize: number;
  qp: CastingJobQP;
}) {
  const [, setState] = useQueryStates(castingJobParsers, { shallow: false });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  const [pageInput, setPageInput] = React.useState(String(page));
  React.useEffect(() => setPageInput(String(page)), [page]);

  const commitPage = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setPageInput(String(page));
      return;
    }
    const next = clampPage(Math.trunc(n));
    setPageInput(String(next));
    if (next !== page) setState({ page: next });
  };

  return (
    <div className="space-y-4">
      <CastingJobToolbar qp={qp} />

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No casting job found.
          </div>
        ) : (
          items.map((job) => (
            <div key={job.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/manufacturing/casting-jobs/${job.id}`}
                    className="block truncate text-base font-medium hover:underline"
                  >
                    {formatFinancialDocumentNumber(job.jobFy, job.jobNo)}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {job.workerNameSnapshot}
                  </div>
                </div>
                <Badge variant={statusVariant(job.status) as any}>{job.status}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Issue Date</div>
                  <div>{formatDate(job.issueDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Worker Type</div>
                  <div>{workerTypeLabel(job.workerType)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Issued</div>
                  <div>
                    {job.totalIssuedQty} / {formatWeight(job.totalIssuedWeightKg)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Received</div>
                  <div>
                    {job.totalReceivedQty} / {formatWeight(job.totalReceivedWeightKg)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <CastingJobAction id={job.id} status={job.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-xl border bg-card p-2 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Job No</TableHead>
              <TableHead className="text-white">Worker</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Issue / ETA</TableHead>
              <TableHead className="text-white">Issued</TableHead>
              <TableHead className="text-white">Received</TableHead>
              <TableHead className="text-white">Pending</TableHead>
              <TableHead className="text-white">Yield %</TableHead>
              <TableHead className="w-[120px] text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No casting job found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/manufacturing/casting-jobs/${job.id}`}
                      className="font-medium hover:underline"
                    >
                      {formatFinancialDocumentNumber(job.jobFy, job.jobNo)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(job.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{job.workerNameSnapshot}</div>
                    <div className="text-xs text-muted-foreground">
                      {workerTypeLabel(job.workerType)}
                      {job.supplier?.companyName
                        ? ` • ${job.supplier.companyName}`
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(job.status) as any}>{job.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(job.issueDate)}</div>
                    <div className="text-xs text-muted-foreground">
                      ETA: {formatDate(job.expectedReturnDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{job.totalIssuedQty}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatWeight(job.totalIssuedWeightKg)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{job.totalReceivedQty}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatWeight(job.totalReceivedWeightKg)}
                    </div>
                  </TableCell>
                  <TableCell>{formatWeight(job.totalPendingWeightKg)}</TableCell>
                  <TableCell>
                    {job.yieldPercent == null ? "-" : `${Number(job.yieldPercent).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="text-right">
                    <CastingJobAction id={job.id} status={job.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!canPrev} onClick={() => setState({ page: page - 1 })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1">
            <span className="text-sm text-muted-foreground">Page</span>
            <div className="w-6">
              <Input
                className="border-none bg-transparent p-0 pl-2"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => commitPage(pageInput)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitPage(pageInput);
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setPageInput(String(page));
                  }
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground">/ {totalPages}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => commitPage(pageInput)}
              className="h-8"
            >
              Go
            </Button>
          </div>

          <Button variant="outline" disabled={!canNext} onClick={() => setState({ page: page + 1 })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
