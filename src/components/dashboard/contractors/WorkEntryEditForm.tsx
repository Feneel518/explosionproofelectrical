"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWorkEntryAction } from "@/lib/actions/dashboard/contractors/workEntries/UpdateWorkEntry";
import { buildContractorRateLabel } from "@/lib/helpers/globalHelpers/contractorLabels";

type WorkerOption = {
  id: string;
  name: string;
  code: string;
};

type RateOption = {
  id: string;
  productName: string;
  operationName: string;
  sideLabel: string | null;
  unit: string;
  defaultRate: number;
};

type EntryRecord = {
  id: string;
  workerId: string;
  contractorRateId: string | null;
  date: string;
  qty: number;
  notes: string | null;
};

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function WorkEntryEditForm({
  workers,
  rates,
  entry,
}: {
  workers: WorkerOption[];
  rates: RateOption[];
  entry: EntryRecord;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [workerId, setWorkerId] = React.useState(entry.workerId);
  const [contractorRateId, setContractorRateId] = React.useState(
    entry.contractorRateId ?? rates[0]?.id ?? "",
  );
  const [date, setDate] = React.useState(entry.date);
  const [qty, setQty] = React.useState(String(entry.qty));
  const [notes, setNotes] = React.useState(entry.notes ?? "");

  const selectedRate = rates.find((rate) => rate.id === contractorRateId) ?? null;
  const amount = Number(qty || 0) * (selectedRate?.defaultRate ?? 0);

  const onSubmit = () => {
    startTransition(async () => {
      const result = await updateWorkEntryAction({
        id: entry.id,
        workerId,
        contractorRateId,
        date: new Date(date),
        qty: Number(qty),
        notes: notes || null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(
        `/dashboard/contractors/entries?workerId=${workerId}&monthYear=${date.slice(0, 7)}`,
      );
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Work Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Select value={workerId} onValueChange={setWorkerId}>
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
          <DatePicker value={date} onChange={(value) => setDate(value ?? "")} />
        </div>

        <Select value={contractorRateId} onValueChange={setContractorRateId}>
          <SelectTrigger>
            <SelectValue placeholder="Select work row" />
          </SelectTrigger>
          <SelectContent>
            {rates.map((rate) => (
              <SelectItem key={rate.id} value={rate.id}>
                {buildContractorRateLabel({
                  productName: rate.productName,
                  operationName: rate.operationName,
                  sideLabel: rate.sideLabel,
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid gap-3 md:grid-cols-2">
          <Input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        </div>

        {selectedRate ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline">
              {money(selectedRate.defaultRate)} / {selectedRate.unit}
            </Badge>
            <span>
              Amount: <span className="font-semibold text-foreground">{money(amount)}</span>
            </span>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="button" onClick={onSubmit} disabled={pending}>
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
