import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qRaw = sp.q;
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw || "").trim();

  const jobs = await prisma.castingJob.findMany({
    where: {
      status: {
        in: ["IN_PROGRESS", "PARTIAL_RECEIVED", "CLOSED"],
      },
      ...(q
        ? { workerNameSnapshot: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      jobNo: true,
      jobFy: true,
      status: true,
      workerNameSnapshot: true,
      workerType: true,
      issueDate: true,
      totalIssuedQty: true,
      totalIssuedWeightKg: true,
      totalReceivedQty: true,
      totalReceivedWeightKg: true,
      totalPendingWeightKg: true,
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          inputTitle: true,
          outputTitle: true,
          issuedQty: true,
          issuedWeightKg: true,
          receivedQty: true,
          receivedWeightKg: true,
          pendingWeightKg: true,
        },
      },
    },
    take: 500,
  });

  const workerMap = new Map<
    string,
    {
      workerName: string;
      workerType: string;
      jobs: number;
      issuedQty: number;
      issuedWeight: number;
      receivedQty: number;
      receivedWeight: number;
      pendingWeight: number;
    }
  >();

  for (const job of jobs) {
    const key = `${job.workerNameSnapshot}||${job.workerType}`;
    const current = workerMap.get(key) ?? {
      workerName: job.workerNameSnapshot,
      workerType: job.workerType,
      jobs: 0,
      issuedQty: 0,
      issuedWeight: 0,
      receivedQty: 0,
      receivedWeight: 0,
      pendingWeight: 0,
    };

    current.jobs += 1;
    current.issuedQty += Number(job.totalIssuedQty || 0);
    current.issuedWeight += Number(job.totalIssuedWeightKg || 0);
    current.receivedQty += Number(job.totalReceivedQty || 0);
    current.receivedWeight += Number(job.totalReceivedWeightKg || 0);
    current.pendingWeight += Number(job.totalPendingWeightKg || 0);
    workerMap.set(key, current);
  }

  const workers = Array.from(workerMap.values()).sort(
    (a, b) => b.pendingWeight - a.pendingWeight,
  );

  const totalIssuedWeight = jobs.reduce(
    (sum, job) => sum + Number(job.totalIssuedWeightKg || 0),
    0,
  );
  const totalReceivedWeight = jobs.reduce(
    (sum, job) => sum + Number(job.totalReceivedWeightKg || 0),
    0,
  );
  const totalPendingWeight = jobs.reduce(
    (sum, job) => sum + Number(job.totalPendingWeightKg || 0),
    0,
  );

  const ledgerRows = jobs.flatMap((job) =>
    job.items.map((item) => ({
      jobId: job.id,
      jobNo: formatFinancialDocumentNumber(job.jobFy, job.jobNo),
      jobStatus: job.status,
      issueDate: job.issueDate,
      workerName: job.workerNameSnapshot,
      workerType: job.workerType,
      inputTitle: item.inputTitle,
      outputTitle: item.outputTitle,
      issuedQty: Number(item.issuedQty || 0),
      issuedWeight: Number(item.issuedWeightKg || 0),
      receivedQty: Number(item.receivedQty || 0),
      receivedWeight: Number(item.receivedWeightKg || 0),
      pendingWeight: Number(item.pendingWeightKg || 0),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Worker Casting Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Track aluminum issued to workers, casting received back, and jalan/loss by weight.
        </p>
      </div>

      <form className="rounded-xl border bg-card p-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Search Worker</label>
            <Input name="q" defaultValue={q} placeholder="Worker name..." />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Apply
            </button>
            <Link
              href="/dashboard/manufacturing/worker-ledger"
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Active Jobs</div>
          <div className="text-2xl font-semibold">{jobs.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Issued Weight</div>
          <div className="text-2xl font-semibold">{totalIssuedWeight.toFixed(3)} kg</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Received Weight</div>
          <div className="text-2xl font-semibold">{totalReceivedWeight.toFixed(3)} kg</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Jalan/Pending Weight</div>
          <div className="text-2xl font-semibold">{totalPendingWeight.toFixed(3)} kg</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Worker Balance Summary</h2>
        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Worker</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Jobs</TableHead>
                <TableHead className="text-white">Issued</TableHead>
                <TableHead className="text-white">Received</TableHead>
                <TableHead className="text-white">Balance/Jalan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No worker ledger data found.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((row) => (
                  <TableRow key={`${row.workerName}-${row.workerType}`}>
                    <TableCell>{row.workerName}</TableCell>
                    <TableCell>{workerTypeLabel(row.workerType)}</TableCell>
                    <TableCell>{row.jobs}</TableCell>
                    <TableCell>
                      {row.issuedQty} / {row.issuedWeight.toFixed(3)} kg
                    </TableCell>
                    <TableCell>
                      {row.receivedQty} / {row.receivedWeight.toFixed(3)} kg
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          row.pendingWeight > 0 ? "font-semibold text-amber-600" : ""
                        }
                      >
                        {row.pendingWeight.toFixed(3)} kg
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Inward / Outward Entries</h2>
        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Job</TableHead>
                <TableHead className="text-white">Worker</TableHead>
                <TableHead className="text-white">Input</TableHead>
                <TableHead className="text-white">Output</TableHead>
                <TableHead className="text-white">Outward</TableHead>
                <TableHead className="text-white">Inward</TableHead>
                <TableHead className="text-white">Jalan/Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No inward/outward entries found.
                  </TableCell>
                </TableRow>
              ) : (
                ledgerRows.map((row) => (
                  <TableRow key={`${row.jobId}-${row.inputTitle}-${row.outputTitle}`}>
                    <TableCell>{formatDate(row.issueDate)}</TableCell>
                    <TableCell>
                      <div>
                        <Link
                          className="hover:underline"
                          href={`/dashboard/manufacturing/casting-jobs/${row.jobId}`}
                        >
                          {row.jobNo}
                        </Link>
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {row.jobStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{row.workerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {workerTypeLabel(row.workerType)}
                      </div>
                    </TableCell>
                    <TableCell>{row.inputTitle}</TableCell>
                    <TableCell>{row.outputTitle}</TableCell>
                    <TableCell>
                      {row.issuedQty} / {row.issuedWeight.toFixed(3)} kg
                    </TableCell>
                    <TableCell>
                      {row.receivedQty} / {row.receivedWeight.toFixed(3)} kg
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          row.pendingWeight > 0 ? "font-semibold text-amber-600" : ""
                        }
                      >
                        {row.pendingWeight.toFixed(3)} kg
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
