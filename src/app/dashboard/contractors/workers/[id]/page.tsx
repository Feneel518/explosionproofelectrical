import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildContractorRateLabel } from "@/lib/helpers/globalHelpers/contractorLabels";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FC } from "react";

export const dynamic = "force-dynamic";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatMoney(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const worker = await prisma.worker.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      address: true,
      joinedAt: true,
      notes: true,
      status: true,
      deletedAt: true,
      createdAt: true,
    },
  });

  if (!worker) {
    notFound();
  }

  // Current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [thisMonthAgg, allTimeAgg, recentEntries, recentLedger, recentCastingJobs] =
    await Promise.all([
      prisma.workEntry.aggregate({
        where: {
          workerId: id,
          deletedAt: null,
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.workEntry.aggregate({
        where: {
          workerId: id,
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      prisma.workEntry.findMany({
        where: { workerId: id, deletedAt: null },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          date: true,
          productNameSnapshot: true,
          operationNameSnapshot: true,
          sideLabelSnapshot: true,
          qty: true,
          rate: true,
          amount: true,
          notes: true,
        },
      }),
      prisma.workerLedgerEntry.findMany({
        where: { workerId: id, deletedAt: null },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          date: true,
          kind: true,
          amount: true,
          notes: true,
        },
      }),
      prisma.castingJob.findMany({
        where: { workerId: id },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        take: 100,
        select: {
          id: true,
          jobNo: true,
          jobFy: true,
          status: true,
          issueDate: true,
          totalIssuedWeightKg: true,
          totalReceivedQty: true,
          totalReceivedWeightKg: true,
          totalPendingWeightKg: true,
          items: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              inputTitle: true,
              issuedWeightKg: true,
            },
          },
          receipts: {
            orderBy: [{ receivedAt: "desc" }, { receiptNo: "desc" }],
            select: {
              id: true,
              receiptNo: true,
              receivedAt: true,
              items: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  receivedQty: true,
                  receivedWeightKg: true,
                  castingJobItem: { select: { outputTitle: true } },
                },
              },
            },
          },
        },
      }),
    ]);

  const thisMonthEarnings = Number(thisMonthAgg._sum.amount ?? 0);
  const allTimeEarnings = Number(allTimeAgg._sum.amount ?? 0);
  const materialLedger = recentCastingJobs
    .flatMap((job) => {
      const referenceNo = formatFinancialDocumentNumber(job.jobFy, job.jobNo);
      const issues = job.items.map((item) => ({
        id: `issue-${item.id}`,
        date: job.issueDate,
        direction: "OUT" as const,
        item: item.inputTitle,
        qty: null as number | null,
        weightKg: Number(item.issuedWeightKg),
        referenceNo,
        jobId: job.id,
      }));
      const receipts = job.receipts.flatMap((receipt) =>
        receipt.items.map((item) => ({
          id: `receipt-${item.id}`,
          date: receipt.receivedAt,
          direction: "IN" as const,
          item: item.castingJobItem.outputTitle,
          qty: item.receivedQty,
          weightKg: Number(item.receivedWeightKg),
          referenceNo: `${referenceNo} / R${receipt.receiptNo}`,
          jobId: job.id,
        })),
      );
      return [...issues, ...receipts];
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {worker.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {worker.code}
            </span>
            <Badge variant="outline">{worker.role}</Badge>
            {worker.status === "ACTIVE" ? (
              <Badge>ACTIVE</Badge>
            ) : (
              <Badge variant="secondary">INACTIVE</Badge>
            )}
            {worker.deletedAt ? (
              <Badge variant="destructive">DELETED</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/contractors/workers/${worker.id}/edit`}>
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/dashboard/contractors/entries?workerId=${worker.id}`}>
              Add Entry
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/contractors/payouts?workerId=${worker.id}`}>
              Add Advance / Deduction
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">
            This Month Earnings
          </div>
          <div className="text-2xl font-semibold">
            {formatMoney(thisMonthEarnings)}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">All Time Earnings</div>
          <div className="text-2xl font-semibold">
            {formatMoney(allTimeEarnings)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Worker Information</h2>
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">Code:</span>{" "}
            <span className="font-mono">{worker.code}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Name:</span> {worker.name}
          </div>
          <div>
            <span className="text-muted-foreground">Role:</span> {worker.role}
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>{" "}
            {worker.phone ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            {worker.email ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Joining Date:</span>{" "}
            {formatDate(worker.joinedAt)}
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Address:</span>{" "}
            {worker.address ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Notes:</span>{" "}
            {worker.notes ?? "-"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Worker Material Ledger</h2>
          <p className="text-sm text-muted-foreground">
            OUT is aluminum scrap/ingot handed to the worker. IN is casting received back.
          </p>
        </div>
        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Entry</TableHead>
                <TableHead className="text-white">Material</TableHead>
                <TableHead className="text-right text-white">Qty</TableHead>
                <TableHead className="text-right text-white">Weight</TableHead>
                <TableHead className="text-white">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialLedger.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No aluminum or casting entries for this worker.
                  </TableCell>
                </TableRow>
              ) : (
                materialLedger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.direction === "OUT" ? "destructive" : "default"}>
                        {entry.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.item}</TableCell>
                    <TableCell className="text-right">{entry.qty ?? "-"}</TableCell>
                    <TableCell className="text-right">{entry.weightKg.toFixed(3)} kg</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/manufacturing/casting-jobs/${entry.jobId}`}
                        className="hover:underline"
                      >
                        {entry.referenceNo}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Aluminum & Casting Jobs</h2>
            <p className="text-sm text-muted-foreground">
              Aluminum issued to this worker and castings received back.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/dashboard/manufacturing/casting-jobs/new?workerId=${worker.id}`}>
              New Casting Job
            </Link>
          </Button>
        </div>
        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Date / Job</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-right text-white">Aluminum Issued</TableHead>
                <TableHead className="text-right text-white">Castings Received</TableHead>
                <TableHead className="text-right text-white">Pending Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCastingJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No casting jobs linked to this worker yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentCastingJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/manufacturing/casting-jobs/${job.id}`}
                        className="font-medium hover:underline"
                      >
                        {formatFinancialDocumentNumber(job.jobFy, job.jobNo)}
                      </Link>
                      <div className="text-xs text-muted-foreground">{formatDate(job.issueDate)}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{job.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {Number(job.totalIssuedWeightKg).toFixed(3)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {job.totalReceivedQty} / {Number(job.totalReceivedWeightKg).toFixed(3)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(job.totalPendingWeightKg).toFixed(3)} kg
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Recent Work Entries</h2>
        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Work Row</TableHead>
                <TableHead className="text-white text-right">Qty</TableHead>
                <TableHead className="text-white text-right">Rate</TableHead>
                <TableHead className="text-white text-right">Amount</TableHead>
                <TableHead className="text-white">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground">
                    No work entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentEntries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      {buildContractorRateLabel({
                        productName: row.productNameSnapshot,
                        operationName: row.operationNameSnapshot,
                        sideLabel: row.sideLabelSnapshot,
                      })}
                    </TableCell>
                    <TableCell className="text-right">{row.qty}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(row.rate))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(row.amount))}
                    </TableCell>
                    <TableCell>
                      {row.notes ? (
                        row.notes
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Recent Ledger Entries</h2>
        <div className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Kind</TableHead>
                <TableHead className="text-white text-right">Amount</TableHead>
                <TableHead className="text-white">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLedger.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground">
                    No ledger entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentLedger.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(row.amount))}
                    </TableCell>
                    <TableCell>
                      {row.notes ? (
                        row.notes
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/contractors/workers">&larr; Back to Workers</Link>
      </Button>
    </div>
  );
};

export default page;
