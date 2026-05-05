"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkerOption = {
  id: string;
  name: string;
  code: string;
};

export default function EntriesFilters({
  workers,
  initialWorkerId,
  initialMonthYear,
  initialQ,
}: {
  workers: WorkerOption[];
  initialWorkerId: string;
  initialMonthYear: string;
  initialQ: string;
}) {
  const router = useRouter();
  const [workerId, setWorkerId] = React.useState(initialWorkerId || "ALL");
  const [monthYear, setMonthYear] = React.useState(initialMonthYear);
  const [q, setQ] = React.useState(initialQ);

  React.useEffect(() => {
    setWorkerId(initialWorkerId || "ALL");
    setMonthYear(initialMonthYear);
    setQ(initialQ);
  }, [initialMonthYear, initialQ, initialWorkerId]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (workerId !== "ALL") params.set("workerId", workerId);
    if (monthYear) params.set("monthYear", monthYear);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/dashboard/contractors/entries?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Entries</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <Select value={workerId} onValueChange={setWorkerId}>
          <SelectTrigger>
            <SelectValue placeholder="All workers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All workers</SelectItem>
            {workers.map((worker) => (
              <SelectItem key={worker.id} value={worker.id}>
                {worker.name} ({worker.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MonthPicker value={monthYear} onChange={(value) => setMonthYear(value ?? "")} />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product / operation / notes"
        />
        <Button type="button" onClick={applyFilters}>
          Apply
        </Button>
      </CardContent>
    </Card>
  );
}
