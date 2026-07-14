import { NextRequest } from "next/server";

import { buildContractorRateLabel, formatMonthYearLabel } from "@/lib/helpers/globalHelpers/contractorLabels";
import { prisma } from "@/lib/prisma/db";

function csvEscape(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const workerId = request.nextUrl.searchParams.get("workerId");
  const monthYear = request.nextUrl.searchParams.get("monthYear");

  if (!workerId || !monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return new Response("Missing or invalid workerId/monthYear", { status: 400 });
  }

  const [year, month] = monthYear.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [worker, entries, ledger] = await Promise.all([
    prisma.worker.findUnique({
      where: { id: workerId },
      select: { name: true, code: true },
    }),
    prisma.workEntry.findMany({
      where: {
        workerId,
        deletedAt: null,
        date: { gte: start, lt: end },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: {
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
      where: {
        workerId,
        deletedAt: null,
        date: { gte: start, lt: end },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: {
        date: true,
        kind: true,
        amount: true,
        notes: true,
      },
    }),
  ]);

  if (!worker) {
    return new Response("Worker not found", { status: 404 });
  }

  const lines: string[] = [];
  lines.push([csvEscape("Worker"), csvEscape(worker.name)].join(","));
  lines.push([csvEscape("Code"), csvEscape(worker.code)].join(","));
  lines.push([csvEscape("Month"), csvEscape(formatMonthYearLabel(monthYear))].join(","));
  lines.push("");
  lines.push(
    [
      csvEscape("Date"),
      csvEscape("Work Row"),
      csvEscape("Qty"),
      csvEscape("Rate"),
      csvEscape("Amount"),
      csvEscape("Notes"),
    ].join(","),
  );

  let earningsTotal = 0;
  for (const entry of entries) {
    const amount = Number(entry.amount);
    earningsTotal += amount;
    lines.push(
      [
        csvEscape(entry.date.toISOString().slice(0, 10)),
        csvEscape(
          buildContractorRateLabel({
            productName: entry.productNameSnapshot,
            operationName: entry.operationNameSnapshot,
            sideLabel: entry.sideLabelSnapshot,
          }),
        ),
        csvEscape(entry.qty),
        csvEscape(Number(entry.rate).toFixed(2)),
        csvEscape(amount.toFixed(2)),
        csvEscape(entry.notes),
      ].join(","),
    );
  }

  lines.push("");
  lines.push([csvEscape("Total Earnings"), csvEscape(earningsTotal.toFixed(2))].join(","));
  lines.push("");
  lines.push(
    [csvEscape("Ledger Date"), csvEscape("Kind"), csvEscape("Amount"), csvEscape("Notes")].join(","),
  );

  for (const row of ledger) {
    lines.push(
      [
        csvEscape(row.date.toISOString().slice(0, 10)),
        csvEscape(row.kind),
        csvEscape(Number(row.amount).toFixed(2)),
        csvEscape(row.notes),
      ].join(","),
    );
  }

  const body = `\uFEFF${lines.join("\r\n")}`;
  const fileName = `${worker.name.replace(/[^\w-]+/g, "_")}_${monthYear}_history.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
