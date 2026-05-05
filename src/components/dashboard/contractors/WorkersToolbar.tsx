"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  workersParsers,
  WorkersQP,
  WorkerStatusOptions,
  WorkerRoleOptions,
  WorkerSort,
  TrashFilter,
} from "@/lib/searchParams/dashboard/contractors/workersSearchParams";
import { Plus, X } from "lucide-react";
import React from "react";
import { useDebouncedValue } from "@/hooks/useDebounce";

export default function WorkersToolbar({ qp }: { qp: WorkersQP }) {
  const [state, setState] = useQueryStates(workersParsers, {
    shallow: false,
  });

  const [search, setSearch] = React.useState(state.q ?? "");
  const debouncedSearch = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.role !== "ALL" ? 1 : 0) +
    (qp.trash !== "EXCLUDE" ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center max-md:grid max-md:grid-cols-2">
        <Input
          className="md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / code / phone / email..."
        />

        <Select
          value={state.status ?? "ALL"}
          onValueChange={(v) => setState({ status: v as any, page: 1 })}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {WorkerStatusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={state.role ?? "ALL"}
          onValueChange={(v) => setState({ role: v as any, page: 1 })}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {WorkerRoleOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={state.trash ?? "EXCLUDE"}
          onValueChange={(v) => setState({ trash: v as any, page: 1 })}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Trash" />
          </SelectTrigger>
          <SelectContent>
            {TrashFilter.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${state.sort ?? "createdAt"}:${state.dir ?? "desc"}`}
          onValueChange={(v) => {
            const [sort, dir] = v.split(":");
            setState({ sort: sort as any, dir: dir as any, page: 1 });
          }}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {WorkerSort.map((s) => (
              <div key={s}>
                <SelectItem key={`${s}-asc`} value={`${s}:asc`}>
                  Sort: {s} (asc)
                </SelectItem>
                <SelectItem key={`${s}-desc`} value={`${s}:desc`}>
                  Sort: {s} (desc)
                </SelectItem>
              </div>
            ))}
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button
            variant="outline"
            onClick={() =>
              setState({
                q: "",
                status: "ALL",
                role: "ALL",
                trash: "EXCLUDE",
                sort: "createdAt",
                dir: "desc",
                page: 1,
              })
            }>
            <X className="mr-2 h-4 w-4" />
            Reset ({activeFilters})
          </Button>
        )}
      </div>

      <Button asChild>
        <Link href="/dashboard/contractors/workers/new">
          <Plus />New Worker
        </Link>
      </Button>
    </div>
  );
}
