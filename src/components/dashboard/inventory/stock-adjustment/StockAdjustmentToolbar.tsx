"use client";

import React from "react";
import Link from "next/link";
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
  getFinancialYearLabelFromStartYear,
  getFinancialYearStartYear,
} from "@/lib/helpers/globalHelpers/financialYear";
import {
  stockAdjustmentParsers,
  STOCK_ADJUSTMENT_SORTS,
  STOCK_ADJUSTMENT_STATUSES,
  StockAdjustmentQP,
} from "@/lib/searchParams/dashboard/inventory/stock-adjustment/StockAdjustmentSearchParams";

const FY_YEARS = Array.from(
  { length: 10 },
  (_, i) => getFinancialYearStartYear() - i,
);

export default function StockAdjustmentToolbar({ qp }: { qp: StockAdjustmentQP }) {
  const [state, setState] = useQueryStates(stockAdjustmentParsers, {
    shallow: false,
  });

  const defaultYear = getFinancialYearStartYear();
  const defaultFy = getFinancialYearLabelFromStartYear(defaultYear);
  const selectedYear = state.year ?? defaultYear;
  const fy = getFinancialYearLabelFromStartYear(selectedYear);

  const [search, setSearch] = React.useState(state.q ?? "");
  const debounced = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({ q: debounced, page: 1 });
  }, [debounced, setState]);

  React.useEffect(() => {
    if (state.fy !== fy) setState({ fy, page: 1 });
  }, [fy, state.fy, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.fy !== defaultFy ? 1 : 0) +
    (qp.sort !== "adjustDate" ? 1 : 0) +
    (qp.dir !== "desc" ? 1 : 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <div className="col-span-2">
        <h3>Search</h3>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search adjusted by / reason / remarks..."
        />
      </div>

      <div>
        <h3>Status</h3>
        <Select
          value={state.status}
          onValueChange={(value) => setState({ status: value as any, page: 1 })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_ADJUSTMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3>Year</h3>
        <Select
          value={String(selectedYear)}
          onValueChange={(value) => {
            const year = Number(value);
            setState({
              year,
              fy: getFinancialYearLabelFromStartYear(year),
              page: 1,
            });
          }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="FY Year" />
          </SelectTrigger>
          <SelectContent>
            {FY_YEARS.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year} ({getFinancialYearLabelFromStartYear(year)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3>Sort</h3>
        <Select
          value={`${state.sort}:${state.dir}`}
          onValueChange={(value) => {
            const [sort, dir] = value.split(":");
            setState({ sort: sort as any, dir: dir as any, page: 1 });
          }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_ADJUSTMENT_SORTS.map((sort) => (
              <React.Fragment key={sort}>
                <SelectItem value={`${sort}:asc`}>{sort} (asc)</SelectItem>
                <SelectItem value={`${sort}:desc`}>{sort} (desc)</SelectItem>
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilters > 0 ? (
        <Button
          variant="outline"
          onClick={() => {
            setState({
              q: "",
              status: "ALL",
              year: defaultYear,
              fy: defaultFy,
              sort: "adjustDate",
              dir: "desc",
              page: 1,
            });
            setSearch("");
          }}>
          <X className="mr-2 h-4 w-4" />
          Reset ({activeFilters})
        </Button>
      ) : null}

      <Button asChild className="col-span-2 lg:col-span-1">
        <Link href="/dashboard/inventory/adjustments/new">
          <Plus className="mr-2 h-4 w-4" />
          New Adjustment
        </Link>
      </Button>
    </div>
  );
}
