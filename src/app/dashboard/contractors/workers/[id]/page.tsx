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

  const [thisMonthAgg, allTimeAgg, recentEntries, recentLedger] =
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
    ]);

  const thisMonthEarnings = Number(thisMonthAgg._sum.amount ?? 0);
  const allTimeEarnings = Number(allTimeAgg._sum.amount ?? 0);

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
