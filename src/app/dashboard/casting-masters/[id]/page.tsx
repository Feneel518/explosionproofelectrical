import { FC } from "react";
import Link from "next/link";

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
import CastingMasterOpeningStockCard from "@/components/dashboard/casting-master/CastingMasterOpeningStockCard";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(value);
}

const Page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  const monthLabel = formatMonthLabel(monthStart);

  const [casting, jobItems, stockAggAll, stockAggMonth, lastStockMovement] =
    await Promise.all([
    prisma.castingMaster.findUnique({
      where: { id },
      select: {
        id: true,
        castingItemName: true,
        castingCode: true,
        drawingNumber: true,
        hsnCode: true,
        unit: true,
        standardWeightKg: true,
        reorderLevel: true,
        description: true,
        openingStockQty: true,
        openingStockUnitCost: true,
        openingStockAt: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        stockBalance: {
          select: {
            qtyOnHand: true,
          },
        },
      },
    }),
    prisma.castingJobItem.findMany({
      where: {
        outputCastingId: id,
        castingJob: {
          status: {
            in: ["IN_PROGRESS", "PARTIAL_RECEIVED", "CLOSED"],
          },
        },
      },
      orderBy: [
        { castingJob: { issueDate: "desc" } },
        { castingJob: { jobNo: "desc" } },
      ],
      select: {
        id: true,
        outputTitle: true,
        issuedQty: true,
        issuedWeightKg: true,
        receivedQty: true,
        receivedWeightKg: true,
        pendingWeightKg: true,
        castingJob: {
          select: {
            id: true,
            jobNo: true,
            jobFy: true,
            workerNameSnapshot: true,
            workerType: true,
            status: true,
            issueDate: true,
          },
        },
      },
      take: 300,
    }),
    prisma.stockLedger.aggregate({
      where: { castingMasterId: id },
      _sum: {
        qtyIn: true,
        qtyOut: true,
      },
    }),
    prisma.stockLedger.aggregate({
      where: {
        castingMasterId: id,
        movementDate: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      _sum: {
        qtyIn: true,
        qtyOut: true,
      },
    }),
    prisma.stockLedger.findFirst({
      where: { castingMasterId: id },
      orderBy: [{ createdAt: "desc" }, { movementDate: "desc" }],
      select: {
        movementDate: true,
        createdAt: true,
        movementType: true,
        referenceType: true,
        referenceNo: true,
        qtyIn: true,
        qtyOut: true,
      },
    }),
    ]);

  if (!casting) {
    return <div className="text-sm text-muted-foreground">Casting master not found.</div>;
  }

  const allIn = Number(stockAggAll._sum.qtyIn ?? 0);
  const allOut = Number(stockAggAll._sum.qtyOut ?? 0);
  const monthIn = Number(stockAggMonth._sum.qtyIn ?? 0);
  const monthOut = Number(stockAggMonth._sum.qtyOut ?? 0);
  const onHand = Number(casting.stockBalance?.qtyOnHand ?? 0);
  const openingThisMonth = onHand - monthIn + monthOut;

  const totalIssuedWeight = jobItems.reduce(
    (sum, row) => sum + Number(row.issuedWeightKg || 0),
    0,
  );
  const totalReceivedWeight = jobItems.reduce(
    (sum, row) => sum + Number(row.receivedWeightKg || 0),
    0,
  );
  const totalPendingWeight = jobItems.reduce(
    (sum, row) => sum + Number(row.pendingWeightKg || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {casting.castingItemName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{casting.status}</Badge>
            {casting.deletedAt ? <Badge variant="destructive">DELETED</Badge> : null}
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/casting-masters/${casting.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="text-sm">
          <span className="text-muted-foreground">Casting Code:</span>{" "}
          {casting.castingCode || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Drawing Number:</span>{" "}
          {casting.drawingNumber || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">HSN Code:</span> {casting.hsnCode || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Unit:</span> {casting.unit}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Standard Weight:</span>{" "}
          {casting.standardWeightKg == null ? "-" : `${Number(casting.standardWeightKg).toFixed(3)} kg`}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Reorder Level:</span>{" "}
          {casting.reorderLevel ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Current On Hand:</span>{" "}
          {Number(casting.stockBalance?.qtyOnHand ?? 0)}
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {new Date(casting.createdAt).toLocaleString()}
        </div>
      </div>

      <CastingMasterOpeningStockCard
        castingMasterId={casting.id}
        itemName={casting.castingItemName}
        currentOnHand={Number(casting.stockBalance?.qtyOnHand ?? 0)}
        openingStockQty={casting.openingStockQty ?? 0}
        openingStockUnitCost={
          casting.openingStockUnitCost == null
            ? null
            : Number(casting.openingStockUnitCost)
        }
        openingStockAt={casting.openingStockAt}
      />

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Stock In/Out Summary</h2>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">
              Opening ({monthLabel})
            </div>
            <div className="text-xl font-semibold">
              {formatNumber(openingThisMonth)} {casting.unit}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">
              Inward MTD ({monthLabel})
            </div>
            <div className="text-xl font-semibold">
              {formatNumber(monthIn)} {casting.unit}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">
              Outward MTD ({monthLabel})
            </div>
            <div className="text-xl font-semibold">
              {formatNumber(monthOut)} {casting.unit}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">On Hand</div>
            <div className="text-xl font-semibold">
              {formatNumber(onHand)} {casting.unit}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Inward (All Time)</div>
            <div className="text-xl font-semibold">
              {formatNumber(allIn)} {casting.unit}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Outward (All Time)</div>
            <div className="text-xl font-semibold">
              {formatNumber(allOut)} {casting.unit}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {lastStockMovement
            ? `Last movement: ${formatDate(lastStockMovement.createdAt)} • ${lastStockMovement.movementType} • IN ${formatNumber(Number(lastStockMovement.qtyIn))} / OUT ${formatNumber(Number(lastStockMovement.qtyOut))} • ${lastStockMovement.referenceType}${lastStockMovement.referenceNo ? ` (${lastStockMovement.referenceNo})` : ""}`
            : "Last movement: -"}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Worker Consumption Summary</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Issued Weight</div>
            <div className="text-xl font-semibold">{totalIssuedWeight.toFixed(3)} kg</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Received Weight</div>
            <div className="text-xl font-semibold">{totalReceivedWeight.toFixed(3)} kg</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Pending / Jalan</div>
            <div className="text-xl font-semibold">{totalPendingWeight.toFixed(3)} kg</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Casting Job Ledger</h2>
        {jobItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No casting job entries found for this casting yet.
          </div>
        ) : (
          <div className="rounded-xl border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Issue Date</TableHead>
                  <TableHead className="text-white">Job</TableHead>
                  <TableHead className="text-white">Worker</TableHead>
                  <TableHead className="text-white">Issued</TableHead>
                  <TableHead className="text-white">Received</TableHead>
                  <TableHead className="text-white">Jalan/Pending</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.castingJob.issueDate)}</TableCell>
                    <TableCell>
                      <Link
                        className="hover:underline"
                        href={`/dashboard/manufacturing/casting-jobs/${row.castingJob.id}`}
                      >
                        {formatFinancialDocumentNumber(row.castingJob.jobFy, row.castingJob.jobNo)}
                      </Link>
                    </TableCell>
                    <TableCell>{row.castingJob.workerNameSnapshot}</TableCell>
                    <TableCell>
                      {row.issuedQty} / {Number(row.issuedWeightKg || 0).toFixed(3)} kg
                    </TableCell>
                    <TableCell>
                      {row.receivedQty} / {Number(row.receivedWeightKg || 0).toFixed(3)} kg
                    </TableCell>
                    <TableCell>{Number(row.pendingWeightKg || 0).toFixed(3)} kg</TableCell>
                    <TableCell>{row.castingJob.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/casting-masters">Back to Casting Masters</Link>
      </Button>
    </div>
  );
};

export default Page;
