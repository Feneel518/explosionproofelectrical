"use client";

import * as React from "react";
import { useQueryStates } from "nuqs";
import { X } from "lucide-react";

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
import { useDebouncedValue } from "@/hooks/useDebounce";
import {
  workEntriesParsers,
  WorkEntriesQP,
  WorkEntrySort,
  SortDir,
} from "@/lib/searchParams/dashboard/contractors/workEntriesSearchParams";

type WorkerOption = {
  id: string;
  name: string;
  code: string;
};

export default function EntriesFilters({
  workers,
  qp,
}: {
  workers: WorkerOption[];
  qp: WorkEntriesQP;
}) {
  const [, setState] = useQueryStates(workEntriesParsers, {
    shallow: false,
  });
  const [workerId, setWorkerId] = React.useState(qp.workerId || "ALL");
  const [monthYear, setMonthYear] = React.useState(qp.monthYear);
  const [q, setQ] = React.useState(qp.q);
  const debouncedQ = useDebouncedValue(q, 500);

  React.useEffect(() => {
    setWorkerId(qp.workerId || "ALL");
    setMonthYear(qp.monthYear);
    setQ(qp.q);
  }, [qp.monthYear, qp.q, qp.workerId]);

  React.useEffect(() => {
    const normalizedQ = debouncedQ.trim();
    if (normalizedQ === qp.q) return;
    void setState({ q: normalizedQ, page: 1 });
  }, [debouncedQ, qp.q, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.workerId ? 1 : 0) +
    (qp.monthYear ? 1 : 0) +
    (qp.sort !== "date" ? 1 : 0) +
    (qp.dir !== "desc" ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Entries</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Select
          value={workerId}
          onValueChange={(value) => {
            setWorkerId(value);
            void setState({
              workerId: value === "ALL" ? "" : value,
              page: 1,
            });
          }}>
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
        <MonthPicker
          value={monthYear}
          onChange={(value) => {
            const nextValue = value ?? "";
            setMonthYear(nextValue);
            void setState({ monthYear: nextValue, page: 1 });
          }}
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product / operation / notes"
        />
        <Select
          value={`${qp.sort}:${qp.dir}`}
          onValueChange={(value) => {
            const [sort, dir] = value.split(":");
            void setState({
              sort: sort as (typeof WorkEntrySort)[number],
              dir: dir as (typeof SortDir)[number],
              page: 1,
            });
          }}>
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {WorkEntrySort.map((sort) => (
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
              setWorkerId("ALL");
              setMonthYear("");
              setQ("");
              void setState({
                q: "",
                workerId: "",
                monthYear: "",
                sort: "date",
                dir: "desc",
                page: 1,
              });
            }}>
            <X className="mr-2 h-4 w-4" />
            Reset ({activeFilters})
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
