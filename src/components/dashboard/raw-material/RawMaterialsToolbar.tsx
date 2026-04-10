"use client";

import Link from "next/link";
import * as React from "react";
import { useQueryStates } from "nuqs";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebounce";
import {
  rawMaterialsParsers,
  RawMaterialsQP,
  RawMaterialSort,
  RawMaterialStatus,
  TrashFilter,
} from "@/lib/searchParams/dashboard/raw-materials/rawMaterialsSearchParams";

export default function RawMaterialsToolbar({ qp }: { qp: RawMaterialsQP }) {
  const [state, setState] = useQueryStates(rawMaterialsParsers, {
    shallow: false,
  });

  const [search, setSearch] = React.useState(state.q ?? "");
  const debouncedSearch = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.trash !== "EXCLUDE" ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between flex-wrap">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <Input
          className="md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search our name / supplier name / code / HSN"
        />

        <Select
          value={state.status ?? "ALL"}
          onValueChange={(v) => setState({ status: v as any, page: 1 })}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {RawMaterialStatus.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
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
            {RawMaterialSort.map((s) => (
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
        <Link href="/dashboard/raw-materials/new">
          <Plus />
          New Raw Material
        </Link>
      </Button>
    </div>
  );
}
