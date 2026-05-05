"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createLedgerEntryAction } from "@/lib/actions/dashboard/contractors/ledger/CreateLedgerEntry";
import { settlePayoutAction } from "@/lib/actions/dashboard/contractors/payouts/SettlePayout";
import { WORKER_LEDGER_KINDS } from "@/lib/constants/contractors";
import {
  buildContractorRateLabel,
  formatMonthYearLabel,
} from "@/lib/helpers/globalHelpers/contractorLabels";
import {
  payoutsParsers,
  PayoutsQP,
  PayoutSort,
  SortDir,
} from "@/lib/searchParams/dashboard/contractors/payoutsSearchParams";

type WorkerOption = {
  id: string;
  name: string;
  code: string;
};

type Summary = {
  monthYear: string;
  workerId: string;
  earnings: number;
  advances: number;
  deductions: number;
  bonus: number;
  adjustments: number;
  netPayable: number;
  amountPaid: number;
  applyAdvances: boolean;
  notes: string;
};

type LedgerRow = {
  id: string;
  date: Date;
  kind: string;
  amount: number;
  notes: string | null;
};

type PayoutRow = {
  id: string;
  monthYear: string;
  workerName: string;
  earningsTotal: number;
  netPayable: number;
  amountPaid: number;
  paidAt: Date | null;
};

type HistoryRow = {
  id: string;
  date: Date;
  productNameSnapshot: string;
  operationNameSnapshot: string;
  sideLabelSnapshot: string | null;
  qty: number;
  rate: number;
  amount: number;
  notes: string | null;
};

type WorkerLedgerKindValue = (typeof WORKER_LEDGER_KINDS)[number];

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function MonthlyPayoutsManager({
  workers,
  qp,
  selectedWorkerName,
  summary,
  historyRows,
  ledgerRows,
  payouts,
}: {
  workers: WorkerOption[];
  qp: PayoutsQP & { monthYear: string };
  selectedWorkerName: string;
  summary: Summary | null;
  historyRows: HistoryRow[];
  ledgerRows: LedgerRow[];
  payouts: PayoutRow[];
}) {
  const router = useRouter();
  const [, setState] = useQueryStates(payoutsParsers, {
    shallow: false,
  });
  const [pending, startTransition] = React.useTransition();
  const [selectedWorkerId, setSelectedWorkerId] = React.useState(qp.workerId || "ALL");
  const [selectedMonthYear, setSelectedMonthYear] = React.useState(qp.monthYear);
  const [ledgerForm, setLedgerForm] = React.useState({
    workerId: qp.workerId || workers[0]?.id || "",
    date: `${qp.monthYear || new Date().toISOString().slice(0, 7)}-01`,
    kind: "ADVANCE",
    amount: "",
    notes: "",
  });
  const [settlementForm, setSettlementForm] = React.useState({
    workerId: summary?.workerId ?? qp.workerId,
    monthYear: summary?.monthYear ?? qp.monthYear,
    applyAdvances: summary?.applyAdvances ?? true,
    amountPaid: summary ? String(summary.amountPaid) : "",
    notes: summary?.notes ?? "",
  });

  React.useEffect(() => {
    setSelectedWorkerId(qp.workerId || "ALL");
    setSelectedMonthYear(qp.monthYear);
    setLedgerForm({
      workerId: qp.workerId || workers[0]?.id || "",
      date: `${qp.monthYear || new Date().toISOString().slice(0, 7)}-01`,
      kind: "ADVANCE",
      amount: "",
      notes: "",
    });
    setSettlementForm({
      workerId: summary?.workerId ?? qp.workerId,
      monthYear: summary?.monthYear ?? qp.monthYear,
      applyAdvances: summary?.applyAdvances ?? true,
      amountPaid: summary ? String(summary.amountPaid) : "",
      notes: summary?.notes ?? "",
    });
  }, [qp.monthYear, qp.workerId, summary, workers]);

  const applyMonthFilter = () => {
    void setState({
      workerId: selectedWorkerId === "ALL" ? "" : selectedWorkerId,
      monthYear: selectedMonthYear,
      page: 1,
    });
  };

  const activeFilters =
    (qp.workerId ? 1 : 0) +
    (qp.monthYear ? 1 : 0) +
    (qp.sort !== "monthYear" ? 1 : 0) +
    (qp.dir !== "desc" ? 1 : 0);

  const addLedgerEntry = () => {
    startTransition(async () => {
      const result = await createLedgerEntryAction({
        workerId: ledgerForm.workerId,
        date: new Date(ledgerForm.date),
        kind: ledgerForm.kind as WorkerLedgerKindValue,
        amount: Number(ledgerForm.amount),
        notes: ledgerForm.notes || null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const settlePayout = () => {
    startTransition(async () => {
      const result = await settlePayoutAction({
        workerId: settlementForm.workerId,
        monthYear: settlementForm.monthYear,
        applyAdvances: settlementForm.applyAdvances,
        amountPaid: Number(settlementForm.amountPaid || 0),
        notes: settlementForm.notes || null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Select worker</SelectItem>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name} ({worker.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MonthPicker
              value={selectedMonthYear}
              onChange={(value) => setSelectedMonthYear(value ?? "")}
            />
            <Button type="button" onClick={applyMonthFilter}>
              Load Summary
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Select
              value={`${qp.sort}:${qp.dir}`}
              onValueChange={(value) => {
                const [sort, dir] = value.split(":");
                void setState({
                  sort: sort as (typeof PayoutSort)[number],
                  dir: dir as (typeof SortDir)[number],
                  page: 1,
                });
              }}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Sort payouts" />
              </SelectTrigger>
              <SelectContent>
                {PayoutSort.map((sort) => (
                  <React.Fragment key={sort}>
                    <SelectItem value={`${sort}:asc`}>{sort} (asc)</SelectItem>
                    <SelectItem value={`${sort}:desc`}>{sort} (desc)</SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {activeFilters > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedWorkerId("ALL");
                  setSelectedMonthYear("");
                  void setState({
                    workerId: "",
                    monthYear: "",
                    sort: "monthYear",
                    dir: "desc",
                    page: 1,
                  });
                }}>
                <X className="mr-2 h-4 w-4" />
                Reset ({activeFilters})
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add Advance / Deduction / Bonus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={ledgerForm.workerId}
              onValueChange={(value) =>
                setLedgerForm((current) => ({ ...current, workerId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name} ({worker.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 md:grid-cols-3">
              <DatePicker
                value={ledgerForm.date}
                onChange={(value) =>
                  setLedgerForm((current) => ({ ...current, date: value ?? "" }))
                }
              />
              <Select
                value={ledgerForm.kind}
                onValueChange={(value) =>
                  setLedgerForm((current) => ({ ...current, kind: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kind" />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_LEDGER_KINDS.filter((kind) => kind !== "PAYOUT").map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={ledgerForm.amount}
                onChange={(e) =>
                  setLedgerForm((current) => ({ ...current, amount: e.target.value }))
                }
              />
            </div>
            <Input
              placeholder="Notes"
              value={ledgerForm.notes}
              onChange={(e) =>
                setLedgerForm((current) => ({ ...current, notes: e.target.value }))
              }
            />
            <Button type="button" onClick={addLedgerEntry} disabled={pending}>
              Save Ledger Entry
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settle Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {summary
                ? `Working on ${formatMonthYearLabel(summary.monthYear)}`
                : "Choose a worker and month to calculate payable amount."}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <MonthPicker
                value={settlementForm.monthYear}
                onChange={(value) =>
                  setSettlementForm((current) => ({
                    ...current,
                    monthYear: value ?? "",
                  }))
                }
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount paid"
                value={settlementForm.amountPaid}
                onChange={(e) =>
                  setSettlementForm((current) => ({
                    ...current,
                    amountPaid: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={settlementForm.applyAdvances}
                onCheckedChange={(checked) =>
                  setSettlementForm((current) => ({
                    ...current,
                    applyAdvances: Boolean(checked),
                  }))
                }
              />
              <span className="text-sm">Apply advances in this payout</span>
            </div>
            <Input
              placeholder="Settlement notes"
              value={settlementForm.notes}
              onChange={(e) =>
                setSettlementForm((current) => ({ ...current, notes: e.target.value }))
              }
            />
            <Button
              type="button"
              onClick={settlePayout}
              disabled={pending || !settlementForm.workerId || !settlementForm.monthYear}
            >
              Save Monthly Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      {summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Earnings</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{money(summary.earnings)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Advances</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{money(summary.advances)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Deductions</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{money(summary.deductions + summary.adjustments)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Bonus</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{money(summary.bonus)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Net Payable</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{money(summary.netPayable)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Amount Paid</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{money(summary.amountPaid)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Month Work History</CardTitle>
                {summary ? (
                  <Button asChild variant="outline">
                    <a
                      href={`/dashboard/contractors/payouts/export?workerId=${summary.workerId}&monthYear=${summary.monthYear}`}
                    >
                      Download Excel CSV
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="rounded-xl border p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Work Row</TableHead>
                    <TableHead className="text-right text-white">Qty</TableHead>
                    <TableHead className="text-right text-white">Rate</TableHead>
                    <TableHead className="text-right text-white">Amount</TableHead>
                    <TableHead className="text-white">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No work rows found for {selectedWorkerName || "this worker"} in this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyRows.map((row) => (
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
                        <TableCell className="text-right">{money(row.rate)}</TableCell>
                        <TableCell className="text-right">{money(row.amount)}</TableCell>
                        <TableCell>{row.notes ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Month Ledger</CardTitle>
            </CardHeader>
            <CardContent className="rounded-xl border p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Kind</TableHead>
                    <TableHead className="text-right text-white">Amount</TableHead>
                    <TableHead className="text-white">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No manual ledger rows for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell><Badge variant="outline">{row.kind}</Badge></TableCell>
                        <TableCell className="text-right">{money(row.amount)}</TableCell>
                        <TableCell>{row.notes ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Saved Monthly Payouts</CardTitle>
        </CardHeader>
        <CardContent className="rounded-xl border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Month</TableHead>
                <TableHead className="text-white">Worker</TableHead>
                <TableHead className="text-right text-white">Earnings</TableHead>
                <TableHead className="text-right text-white">Net Payable</TableHead>
                <TableHead className="text-right text-white">Paid</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No payout records found.
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => {
                  const status =
                    payout.amountPaid >= payout.netPayable && payout.netPayable > 0
                      ? "PAID"
                      : payout.amountPaid > 0
                        ? "PARTIAL"
                        : "UNPAID";
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>{formatMonthYearLabel(payout.monthYear)}</TableCell>
                      <TableCell>{payout.workerName}</TableCell>
                      <TableCell className="text-right">{money(payout.earningsTotal)}</TableCell>
                      <TableCell className="text-right">{money(payout.netPayable)}</TableCell>
                      <TableCell className="text-right">{money(payout.amountPaid)}</TableCell>
                      <TableCell>
                        <Badge variant={status === "PAID" ? "default" : "secondary"}>
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
