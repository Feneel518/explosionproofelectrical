"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { createWorkEntryBatchAction } from "@/lib/actions/dashboard/contractors/workEntries/CreateWorkEntry";
import { softDeleteWorkEntryAction } from "@/lib/actions/dashboard/contractors/workEntries/UpdateWorkEntry";
import { buildContractorRateLabel } from "@/lib/helpers/globalHelpers/contractorLabels";
import { cn } from "@/lib/utils";

type WorkerOption = {
  id: string;
  name: string;
  code: string;
  role: string;
};

type RateOption = {
  id: string;
  productName: string;
  operationName: string;
  sideLabel: string | null;
  unit: string;
  defaultRate: number;
  role: string | null;
};

type EntryRow = {
  contractorRateId: string;
  qty: string;
  notes: string;
};

type EntryListRow = {
  id: string;
  date: Date;
  workerId: string;
  workerName: string;
  productNameSnapshot: string;
  operationNameSnapshot: string;
  sideLabelSnapshot: string | null;
  unitSnapshot: string | null;
  qty: number;
  rate: number;
  amount: number;
  notes: string | null;
};

type WorkRowComboboxProps = {
  value: string;
  rates: RateOption[];
  onChange: (value: string) => void;
};

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

const blankRow = (): EntryRow => ({
  contractorRateId: "",
  qty: "1",
  notes: "",
});

function WorkRowCombobox({ value, rates, onChange }: WorkRowComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo(
    () =>
      rates.map((rate) => {
        const label = buildContractorRateLabel({
          productName: rate.productName,
          operationName: rate.operationName,
          sideLabel: rate.sideLabel,
        });

        return {
          ...rate,
          label,
          searchValue: [
            label,
            rate.productName,
            rate.operationName,
            rate.sideLabel ?? "",
            rate.role ?? "",
            rate.unit,
          ]
            .join(" ")
            .toLowerCase(),
        };
      }),
    [rates],
  );

  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selected
              ? `${selected.label} - ${money(selected.defaultRate)}`
              : "Search product / work row"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter>
          <CommandInput placeholder="Type product or operation..." />
          <CommandList>
            <CommandEmpty>No work rows found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.searchValue}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className="flex items-start gap-2"
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{option.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {money(option.defaultRate)} / {option.unit}
                      {option.role ? ` • ${option.role}` : ""}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function DailyEntriesManager({
  workers,
  rates,
  entries,
  initialWorkerId,
  initialDate,
}: {
  workers: WorkerOption[];
  rates: RateOption[];
  entries: EntryListRow[];
  initialWorkerId: string;
  initialDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [workerId, setWorkerId] = React.useState(
    initialWorkerId || workers[0]?.id || "",
  );
  const [date, setDate] = React.useState(initialDate);
  const [rows, setRows] = React.useState<EntryRow[]>([blankRow()]);

  const rateMap = React.useMemo(
    () => new Map(rates.map((rate) => [rate.id, rate])),
    [rates],
  );

  const totalAmount = rows.reduce((sum, row) => {
    const rate = rateMap.get(row.contractorRateId);
    return sum + Number(row.qty || 0) * (rate?.defaultRate ?? 0);
  }, 0);

  const updateRow = (index: number, patch: Partial<EntryRow>) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  const submitBatch = () => {
    startTransition(async () => {
      const filteredRows = rows.filter(
        (row) => row.contractorRateId && Number(row.qty) > 0,
      );
      const result = await createWorkEntryBatchAction({
        workerId,
        date: new Date(date),
        rows: filteredRows.map((row) => ({
          contractorRateId: row.contractorRateId,
          qty: Number(row.qty),
          notes: row.notes || null,
        })),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setRows([blankRow()]);
      router.refresh();
    });
  };

  const deleteEntry = (id: string) => {
    startTransition(async () => {
      const result = await softDeleteWorkEntryAction(id);
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
          <CardTitle>Daily Work Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={workerId || undefined} onValueChange={setWorkerId}>
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
            <DatePicker
              value={date}
              onChange={(value) => setDate(value ?? "")}
            />
            <div className="rounded-md border px-3 py-2 text-sm">
              Batch total:{" "}
              <span className="font-semibold">{money(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => {
              const selectedRate = rateMap.get(row.contractorRateId);
              const label = selectedRate
                ? buildContractorRateLabel({
                    productName: selectedRate.productName,
                    operationName: selectedRate.operationName,
                    sideLabel: selectedRate.sideLabel,
                  })
                : "";

              return (
                <div key={index} className="rounded-xl border p-4">
                  <div className="grid gap-3 lg:grid-cols-[2fr,120px,1fr,auto]">
                    <WorkRowCombobox
                      value={row.contractorRateId}
                      rates={rates}
                      onChange={(value) =>
                        updateRow(index, { contractorRateId: value })
                      }
                    />
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(index, { qty: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Notes"
                      value={row.notes}
                      onChange={(e) =>
                        updateRow(index, { notes: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setRows((current) =>
                            current.length === 1
                              ? [blankRow()]
                              : current.filter(
                                  (_, rowIndex) => rowIndex !== index,
                                ),
                          )
                        }>
                        Remove
                      </Button>
                    </div>
                  </div>

                  {selectedRate ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{label}</span>
                      <Badge variant="outline">
                        {money(selectedRate.defaultRate)} / {selectedRate.unit}
                      </Badge>
                      {selectedRate.role ? (
                        <Badge variant="secondary">{selectedRate.role}</Badge>
                      ) : null}
                      <span>
                        Amount:{" "}
                        <span className="font-semibold text-foreground">
                          {money(
                            Number(row.qty || 0) * selectedRate.defaultRate,
                          )}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRows((current) => [...current, blankRow()])}>
              Add Row
            </Button>
            <Button
              type="button"
              onClick={submitBatch}
              disabled={pending || !workerId || !date}>
              Save Daily Rows
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Entries</CardTitle>
        </CardHeader>
        <CardContent className="rounded-xl border p-2! ">
          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Worker</TableHead>
                  <TableHead className="text-white">Work Row</TableHead>
                  <TableHead className="text-right text-white">Qty</TableHead>
                  <TableHead className="text-right text-white">Rate</TableHead>
                  <TableHead className="text-right text-white">
                    Amount
                  </TableHead>
                  <TableHead className="text-right text-white">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground">
                      No entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.workerName}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {buildContractorRateLabel({
                            productName: entry.productNameSnapshot,
                            operationName: entry.operationNameSnapshot,
                            sideLabel: entry.sideLabelSnapshot,
                          })}
                        </div>
                        {entry.notes ? (
                          <div className="text-xs text-muted-foreground">
                            {entry.notes}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">{entry.qty}</TableCell>
                      <TableCell className="text-right">
                        {money(entry.rate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {money(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/dashboard/contractors/entries/${entry.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteEntry(entry.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
